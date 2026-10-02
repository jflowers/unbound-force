package scaffold

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestParseRuntimeVersion_AcceptsAnchoredASCIIVersions(t *testing.T) {
	tests := []struct {
		name         string
		output       string
		allowVPrefix bool
		want         runtimeVersion
	}{
		{name: "node v prefix", output: "v20.0.0", allowVPrefix: true, want: runtimeVersion{20, 0, 0}},
		{name: "node without v prefix", output: "24.1.2\n", allowVPrefix: true, want: runtimeVersion{24, 1, 2}},
		{name: "npm CRLF and ASCII edge trim", output: "\t 11.6.2 \t\r\n", want: runtimeVersion{11, 6, 2}},
		{name: "uint32 boundary", output: "24.4294967295.0", allowVPrefix: true, want: runtimeVersion{24, 4294967295, 0}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := parseRuntimeVersion([]byte(test.output), test.allowVPrefix)
			if err != nil {
				t.Fatalf("parseRuntimeVersion() error: %v", err)
			}
			if got != test.want {
				t.Errorf("parseRuntimeVersion() = %+v, want %+v", got, test.want)
			}
		})
	}
}

func TestParseRuntimeVersion_RejectsMalformedAndOverflowValues(t *testing.T) {
	tests := []struct {
		name         string
		output       string
		allowVPrefix bool
	}{
		{name: "explicit npm v prefix", output: "v10.11.0"},
		{name: "major leading zero", output: "020.1.1", allowVPrefix: true},
		{name: "minor leading zero", output: "20.01.1", allowVPrefix: true},
		{name: "patch leading zero", output: "20.1.01", allowVPrefix: true},
		{name: "Unicode digits", output: "２０.1.1", allowVPrefix: true},
		{name: "positive sign", output: "+20.1.1", allowVPrefix: true},
		{name: "negative sign", output: "-20.1.1", allowVPrefix: true},
		{name: "embedded space", output: "20. 1.1", allowVPrefix: true},
		{name: "embedded tab", output: "20.\t1.1", allowVPrefix: true},
		{name: "prerelease", output: "20.1.1-rc.1", allowVPrefix: true},
		{name: "build metadata", output: "20.1.1+build", allowVPrefix: true},
		{name: "bare carriage return", output: "20.1.1\r", allowVPrefix: true},
		{name: "two terminal line feeds", output: "20.1.1\n\n", allowVPrefix: true},
		{name: "extra line", output: "20.1.1\nextra", allowVPrefix: true},
		{name: "uint32 overflow", output: "20.4294967296.0", allowVPrefix: true},
		{name: "length checked before conversion", output: "20.999999999999999999999999999999.0", allowVPrefix: true},
		{name: "empty", output: "", allowVPrefix: true},
		{name: "four components", output: "20.1.1.1", allowVPrefix: true},
		{name: "two components", output: "20.1", allowVPrefix: true},
		{name: "one component", output: "20", allowVPrefix: true},
		{name: "uppercase V prefix", output: "V20.1.1", allowVPrefix: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got, err := parseRuntimeVersion([]byte(test.output), test.allowVPrefix); err == nil {
				t.Errorf("parseRuntimeVersion(%q) = %+v, want error", test.output, got)
			}
		})
	}
}

func TestValidatePluginRuntime_EnforcesSupportedMajorVersions(t *testing.T) {
	tests := []struct {
		name       string
		nodeOutput string
		npmOutput  string
		wantError  bool
	}{
		{name: "Node 19 rejected", nodeOutput: "v19.9.0\n", npmOutput: "10.0.0\n", wantError: true},
		{name: "Node 20 accepted", nodeOutput: "v20.0.0\n", npmOutput: "10.0.0\n"},
		{name: "Node 24 accepted", nodeOutput: "v24.4294967295.0\n", npmOutput: "11.4294967295.0\n"},
		{name: "Node 25 rejected", nodeOutput: "v25.0.0\n", npmOutput: "10.0.0\n", wantError: true},
		{name: "npm 9 rejected", nodeOutput: "v22.0.0\n", npmOutput: "9.9.9\n", wantError: true},
		{name: "npm 10 accepted", nodeOutput: "v22.0.0\n", npmOutput: "10.0.0\n"},
		{name: "npm 11 accepted", nodeOutput: "v22.0.0\n", npmOutput: "11.0.0\n"},
		{name: "npm 12 rejected", nodeOutput: "v22.0.0\n", npmOutput: "12.0.0\n", wantError: true},
		{name: "npm v prefix rejected", nodeOutput: "v22.0.0\n", npmOutput: "v10.11.0\n", wantError: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			workingDir := filepath.Join(t.TempDir(), ".opencode")
			var commandDirectories []string
			opts := &Options{
				LookPath: func(name string) (string, error) { return "/tools/" + name, nil },
				ExecCmdInDir: func(dir, name string, args ...string) ([]byte, error) {
					commandDirectories = append(commandDirectories, dir)
					switch filepath.Base(name) {
					case "node":
						return []byte(test.nodeOutput), nil
					case "npm":
						return []byte(test.npmOutput), nil
					default:
						return nil, fmt.Errorf("unexpected command %s", name)
					}
				},
			}

			_, _, err := validatePluginRuntime(opts, workingDir)
			if test.wantError && err == nil {
				t.Fatal("validatePluginRuntime() error = nil, want error")
			}
			if !test.wantError && err != nil {
				t.Fatalf("validatePluginRuntime() error: %v", err)
			}
			for _, gotDir := range commandDirectories {
				if gotDir != workingDir {
					t.Errorf("command directory = %q, want %q", gotDir, workingDir)
				}
			}
		})
	}
}

func TestValidatePluginRuntime_CommandFailureIncludesDetectedValueAndRemediation(t *testing.T) {
	workingDir := filepath.Join(t.TempDir(), ".opencode")
	opts := &Options{
		LookPath: func(name string) (string, error) { return "/tools/" + name, nil },
		ExecCmdInDir: func(_ string, name string, _ ...string) ([]byte, error) {
			if filepath.Base(name) == "node" {
				return []byte("v22.0.0\npartial"), errors.New("node failed")
			}
			return nil, errors.New("unexpected command")
		},
	}

	_, _, err := validatePluginRuntime(opts, workingDir)
	if err == nil {
		t.Fatal("validatePluginRuntime() error = nil, want error")
	}
	for _, want := range []string{"v22.0.0", "Node.js 22", "npm 10"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error %q does not contain %q", err, want)
		}
	}
}

func TestValidatePluginRuntime_MissingExecutableStopsBeforeCommands(t *testing.T) {
	opts := &Options{
		LookPath: func(name string) (string, error) {
			return "", fmt.Errorf("%s is missing", name)
		},
		ExecCmdInDir: func(dir, name string, args ...string) ([]byte, error) {
			t.Fatalf("unexpected command in %s: %s %v", dir, name, args)
			return nil, nil
		},
	}

	_, _, err := validatePluginRuntime(opts, filepath.Join(t.TempDir(), ".opencode"))
	if err == nil {
		t.Fatal("validatePluginRuntime() error = nil, want error")
	}
	for _, want := range []string{"resolve Node.js", "Node.js 22", "npm 10"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error %q does not contain %q", err, want)
		}
	}
}

func TestRun_InstallsProbesAndAtomicallyActivatesReviewPlugins(t *testing.T) {
	targetDir := t.TempDir()
	opencodeDir := filepath.Join(targetDir, ".opencode")
	configPath := filepath.Join(targetDir, "opencode.json")
	config := []byte("{\n  \"plugin\": [\"user-owned-plugin\"]\n}\n")
	if err := os.WriteFile(configPath, config, 0o644); err != nil {
		t.Fatalf("write opencode.json: %v", err)
	}

	var events []string
	var stageRoot string
	renameCount := 0
	pluginDestinations := []string{
		filepath.Join(opencodeDir, "plugins", "invoke-agent"),
		filepath.Join(opencodeDir, "plugins", "review-dispatch"),
	}
	assertPluginsAbsent := func(phase string) {
		t.Helper()
		for _, destination := range pluginDestinations {
			if _, err := os.Stat(filepath.Join(destination, "index.ts")); !os.IsNotExist(err) {
				t.Fatalf("%s: plugin source became auto-discoverable at %s: %v", phase, destination, err)
			}
		}
	}

	opts := Options{
		TargetDir: targetDir,
		Version:   "1.0.0-test",
		Stdout:    &bytes.Buffer{},
		LookPath: func(name string) (string, error) {
			events = append(events, "lookpath "+name)
			switch name {
			case "node", "npm", "opencode":
				return filepath.Join("/tools", name), nil
			default:
				return "", fmt.Errorf("executable %q not found", name)
			}
		},
		ExecCmd: func(name string, args ...string) ([]byte, error) {
			t.Fatalf("unexpected cwd-dependent command %s %v", name, args)
			return nil, nil
		},
		ExecCmdInDir: func(dir, name string, args ...string) ([]byte, error) {
			if dir != opencodeDir {
				t.Fatalf("command directory = %q, want %q", dir, opencodeDir)
			}
			assertPluginsAbsent("before " + filepath.Base(name))
			command := filepath.Base(name) + " " + strings.Join(args, " ")
			switch command {
			case "node --version":
				events = append(events, command)
				return []byte("v22.15.0\r\n"), nil
			case "npm --version":
				events = append(events, command)
				return []byte("10.9.2\n"), nil
			case "npm ci --ignore-scripts --omit=dev":
				events = append(events, command)
				return nil, nil
			case "opencode debug config":
				if stageRoot == "" {
					t.Fatal("probe ran before external staging")
				}
				if strings.HasPrefix(stageRoot, filepath.Join(opencodeDir, "plugins")+string(filepath.Separator)) {
					t.Fatalf("stage %q is inside auto-discovery", stageRoot)
				}
				for _, stagedPath := range []string{
					filepath.Join(stageRoot, "plugins", "invoke-agent", "index.ts"),
					filepath.Join(stageRoot, "plugins", "review-dispatch", "index.ts"),
					filepath.Join(stageRoot, "lib", "review-dispatch-lesson-proposal.ts"),
					filepath.Join(stageRoot, "lib", "review-dispatch-sibling-evidence.ts"),
				} {
					if _, err := os.Stat(stagedPath); err != nil {
						t.Fatalf("probe ran before staged input %s existed: %v", stagedPath, err)
					}
				}
				probe, err := os.ReadFile(filepath.Join(opencodeDir, "plugins", pluginProbeDirectoryName, "index.ts"))
				if err != nil {
					t.Fatalf("read generated probe: %v", err)
				}
				if strings.Contains(string(probe), "plan_review_dispatch") {
					events = append(events, "tool-definition probe")
				} else {
					events = append(events, "import probe")
				}
				return []byte("{}\n"), nil
			default:
				t.Fatalf("unexpected command %q", command)
				return nil, nil
			}
		},
		MkdirTemp: func(dir, pattern string) (string, error) {
			if dir != opencodeDir || pattern != ".uf-review-plugins-" {
				t.Fatalf("MkdirTemp(%q, %q), want target .opencode external stage", dir, pattern)
			}
			var err error
			stageRoot, err = os.MkdirTemp(dir, pattern)
			return stageRoot, err
		},
		Rename: func(source, destination string) error {
			if renameCount == 0 {
				assertPluginsAbsent("before atomic activation")
			} else if _, err := os.Stat(filepath.Join(destination, "index.ts")); !os.IsNotExist(err) {
				t.Fatalf("activation destination %q already contains source: %v", destination, err)
			}
			if stageRoot == "" || !strings.HasPrefix(source, stageRoot+string(filepath.Separator)) {
				t.Fatalf("activation source %q is outside stage %q", source, stageRoot)
			}
			if strings.HasPrefix(stageRoot, filepath.Join(opencodeDir, "plugins")+string(filepath.Separator)) {
				t.Fatalf("stage %q is inside auto-discovery", stageRoot)
			}
			if _, err := os.Stat(filepath.Join(source, "index.ts")); err != nil {
				t.Fatalf("staged source is incomplete: %v", err)
			}
			events = append(events, "activate "+filepath.Base(destination))
			renameCount++
			return os.Rename(source, destination)
		},
	}

	result, err := Run(opts)
	if err != nil {
		t.Fatalf("Run() error: %v", err)
	}
	wantActivationEvents := []string{
		"lookpath node",
		"node --version",
		"lookpath npm",
		"npm --version",
		"npm ci --ignore-scripts --omit=dev",
		"lookpath opencode",
		"import probe",
		"tool-definition probe",
		"activate invoke-agent",
		"activate review-dispatch",
	}
	if len(events) < len(wantActivationEvents) || !reflect.DeepEqual(events[:len(wantActivationEvents)], wantActivationEvents) {
		t.Errorf("activation operation order =\n%v\nwant prefix\n%v", events, wantActivationEvents)
	}

	for _, assetPath := range []string{invokeAgentPluginAsset, reviewDispatchPluginAsset} {
		targetPath := filepath.Join(targetDir, mapAssetPath(assetPath))
		got, err := os.ReadFile(targetPath)
		if err != nil {
			t.Fatalf("read activated plugin %s: %v", assetPath, err)
		}
		want, err := assetContent(assetPath)
		if err != nil {
			t.Fatalf("read embedded plugin %s: %v", assetPath, err)
		}
		if !bytes.Equal(got, want) {
			t.Errorf("activated plugin %s differs from embedded source", assetPath)
		}
		if !containsPath(result.Created, mapAssetPath(assetPath)) {
			t.Errorf("activated plugin %s missing from result.Created", assetPath)
		}
	}
	gotConfig, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("read opencode.json: %v", err)
	}
	if !bytes.Equal(gotConfig, config) {
		t.Errorf("opencode.json changed during auto-discovery activation:\n%s", gotConfig)
	}
	if bytes.Contains(gotConfig, []byte("invoke-agent")) || bytes.Contains(gotConfig, []byte("review-dispatch")) {
		t.Error("opencode.json must not register either review plugin")
	}
}

// reviewPluginRunOpts builds an Options whose injected command fakes drive
// the review plugin activation flow. When failInstall is true, `npm ci`
// returns an error (soft failure); otherwise the full install → probe →
// atomic activate path succeeds.
func reviewPluginRunOpts(t *testing.T, targetDir string, stdout io.Writer, failInstall bool) Options {
	t.Helper()
	opencodeDir := filepath.Join(targetDir, ".opencode")
	return Options{
		TargetDir: targetDir,
		Version:   "1.0.0-test",
		Stdout:    stdout,
		LookPath: func(name string) (string, error) {
			switch name {
			case "node", "npm", "opencode":
				return filepath.Join("/tools", name), nil
			default:
				return "", fmt.Errorf("executable %q not found", name)
			}
		},
		ExecCmd: func(name string, args ...string) ([]byte, error) {
			t.Fatalf("unexpected cwd-dependent command %s %v", name, args)
			return nil, nil
		},
		ExecCmdInDir: func(dir, name string, args ...string) ([]byte, error) {
			if dir != opencodeDir {
				t.Fatalf("command directory = %q, want %q", dir, opencodeDir)
			}
			command := filepath.Base(name) + " " + strings.Join(args, " ")
			switch command {
			case "node --version":
				return []byte("v22.15.0\r\n"), nil
			case "npm --version":
				return []byte("10.9.2\n"), nil
			case "npm ci --ignore-scripts --omit=dev":
				if failInstall {
					return []byte("npm ERR! code ENOTCACHED\n"), fmt.Errorf("npm ci failed: offline")
				}
				return nil, nil
			case "opencode debug config":
				return []byte("{}\n"), nil
			default:
				t.Fatalf("unexpected command %q", command)
				return nil, nil
			}
		},
		MkdirTemp: func(dir, pattern string) (string, error) {
			return os.MkdirTemp(dir, pattern)
		},
		Rename: func(source, destination string) error {
			return os.Rename(source, destination)
		},
	}
}

func TestRun_PartialResultOnPluginActivationFailure(t *testing.T) {
	targetDir := t.TempDir()
	opencodeDir := filepath.Join(targetDir, ".opencode")
	var stdout bytes.Buffer

	result, err := Run(reviewPluginRunOpts(t, targetDir, &stdout, true))
	if err != nil {
		t.Fatalf("Run() error = %v, want nil (soft failure exits zero)", err)
	}
	if result.Status != resultStatusPartial {
		t.Errorf("Run() Status = %q, want %q", result.Status, resultStatusPartial)
	}
	if result.FailedSubTools != 1 {
		t.Errorf("Run() FailedSubTools = %d, want 1", result.FailedSubTools)
	}
	if len(result.Created) == 0 {
		t.Error("Run() Created is empty, want repairable scaffold assets retained")
	}

	// Plugin sources must not be left in auto-discovery on failure.
	for _, destination := range []string{
		filepath.Join(opencodeDir, "plugins", "invoke-agent", "index.ts"),
		filepath.Join(opencodeDir, "plugins", "review-dispatch", "index.ts"),
	} {
		if _, statErr := os.Stat(destination); !os.IsNotExist(statErr) {
			t.Errorf("plugin source became auto-discoverable at %s: %v", destination, statErr)
		}
	}

	// The failed and inactive sub-tool plus remediation must be surfaced.
	out := stdout.String()
	for _, want := range []string{"review-plugins", "failed", "activation: inactive", "npm ci --ignore-scripts --omit=dev"} {
		if !strings.Contains(out, want) {
			t.Errorf("Run() output does not surface %q:\n%s", want, out)
		}
	}
}

func TestRun_IndependentSubtoolsContinueOnPluginFailure(t *testing.T) {
	targetDir := t.TempDir()
	var stdout bytes.Buffer

	result, err := Run(reviewPluginRunOpts(t, targetDir, &stdout, true))
	if err != nil {
		t.Fatalf("Run() error = %v, want nil", err)
	}

	// The .gitignore sub-tool runs independently of plugin activation.
	gitignorePath := filepath.Join(targetDir, ".gitignore")
	data, readErr := os.ReadFile(gitignorePath)
	if readErr != nil {
		t.Fatalf("read .gitignore: %v", readErr)
	}
	if !strings.Contains(string(data), gitignoreMarker) {
		t.Error(".gitignore missing UF ignore block; independent sub-tool did not run")
	}

	// Other scaffold assets (non-plugin) were still deployed.
	if !containsPath(result.Created, ".opencode/agents/cobalt-crush-dev.md") {
		t.Error("independent scaffold assets missing from result.Created despite plugin failure")
	}
}

func TestRun_IdempotentRetryAfterPluginFailure(t *testing.T) {
	targetDir := t.TempDir()

	// First run: npm ci fails → soft partial result, no plugin source.
	firstOut := &bytes.Buffer{}
	first, err := Run(reviewPluginRunOpts(t, targetDir, firstOut, true))
	if err != nil {
		t.Fatalf("first Run() error = %v, want nil", err)
	}
	if first.Status != resultStatusPartial || first.FailedSubTools != 1 {
		t.Fatalf("first Run() = Status %q / FailedSubTools %d, want partial/1", first.Status, first.FailedSubTools)
	}

	// Second run: npm ci succeeds → plugins activate, result fully populated.
	secondOut := &bytes.Buffer{}
	second, err := Run(reviewPluginRunOpts(t, targetDir, secondOut, false))
	if err != nil {
		t.Fatalf("second Run() error = %v, want nil (idempotent retry)", err)
	}
	if second.Status != "" {
		t.Errorf("second Run() Status = %q, want empty (success)", second.Status)
	}
	if second.FailedSubTools != 0 {
		t.Errorf("second Run() FailedSubTools = %d, want 0", second.FailedSubTools)
	}
	for _, assetPath := range []string{invokeAgentPluginAsset, reviewDispatchPluginAsset} {
		targetPath := filepath.Join(targetDir, mapAssetPath(assetPath))
		if _, statErr := os.Stat(targetPath); statErr != nil {
			t.Errorf("retry did not activate plugin source %s: %v", assetPath, statErr)
		}
		if !containsPath(second.Created, mapAssetPath(assetPath)) {
			t.Errorf("retry did not record activated plugin %s in result.Created", assetPath)
		}
	}
}
