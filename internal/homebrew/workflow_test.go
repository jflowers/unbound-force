package homebrew

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestReleaseWorkflow_HomebrewPublicationIsOrderedAndFailClosed(t *testing.T) {
	t.Parallel()

	workflow := releaseWorkflowRunBlock(t)
	if !strings.HasPrefix(strings.TrimSpace(workflow), "set -euo pipefail") {
		t.Fatal("Homebrew publication run block must begin with set -euo pipefail")
	}

	stages := []struct {
		name    string
		command string
	}{
		{"Cask checksum patching", "patch_checksums \"$CASK_FILE\""},
		{"transformer archive checksum validation", "TRANSFORMER_ACTUAL_SHA=$(shasum -a 256 \"$TRANSFORMER_ARCHIVE\" | awk '{print $1}')"},
		{"Cask transformation", "\"$TRANSFORMER_DIR/unbound-force\" transform-homebrew-cask"},
		{"semantic validation", "postflight_steps_count=$(grep -Fxc '  postflight_steps do' \"$CASK_FILE\" || true)"},
		{"Homebrew static validation", "brew audit --cask --strict \"$CASK_FILE\""},
		{"staged Cask smoke test", "brew install --cask \"$STAGED_TAP/Casks/unbound-force.rb\""},
		{"canonical tap copy", "cp \"$CASK_FILE\" tap/Casks/unbound-force.rb"},
		{"tap publication", "git push"},
	}

	previous := -1
	for _, stage := range stages {
		position := strings.Index(workflow, stage.command)
		if position == -1 {
			t.Fatalf("Homebrew publication run block is missing %s command %q", stage.name, stage.command)
		}
		if position <= previous {
			t.Fatalf("%s must run after the preceding publication gate", stage.name)
		}
		previous = position
	}

	for _, command := range []string{
		"\"$TRANSFORMER_DIR/unbound-force\" transform-homebrew-cask \\",
		"brew audit --cask --strict \"$CASK_FILE\"",
		"brew install --cask \"$STAGED_TAP/Casks/unbound-force.rb\"",
		"test -x \"$BREW_PREFIX/bin/unbound-force\"",
		"test -L \"$BREW_PREFIX/bin/uf\"",
		"test -x \"$BREW_PREFIX/bin/uf\"",
	} {
		assertFailFastCommand(t, workflow, command)
	}
	for _, validation := range []string{
		"if [ -z \"$TRANSFORMER_SHA\" ] || [ \"$TRANSFORMER_SHA\" != \"$TRANSFORMER_ACTUAL_SHA\" ]; then",
		"if [ \"$postflight_steps_count\" -ne 1 ]; then",
		"if grep -Fqx '  postflight do' \"$CASK_FILE\"; then",
		"if ! grep -Fqx '      run \"/usr/bin/xattr\",' \"$CASK_FILE\" || \\",
	} {
		assertValidationFailureExits(t, workflow, validation)
	}
}

func TestReleaseWorkflow_ValidationMatchesTransformerOutput(t *testing.T) {
	t.Parallel()

	workflow := releaseWorkflowRunBlock(t)
	legacyLines := strings.Split(legacyPostflightHook, "\n")
	declarativeLines := strings.Split(declarativePostflightSteps, "\n")
	checks := []string{
		"postflight_steps_count=$(grep -Fxc '" + declarativeLines[0] + "' \"$CASK_FILE\" || true)",
		"if grep -Fqx '" + legacyLines[0] + "' \"$CASK_FILE\"; then",
		"grep -Fqx '" + declarativeLines[2] + "' \"$CASK_FILE\"",
		"grep -Fqx '" + declarativeLines[3] + "' \"$CASK_FILE\"",
		"grep -Fqx '" + declarativeLines[4] + "' \"$CASK_FILE\"",
	}
	for _, check := range checks {
		if !strings.Contains(workflow, check) {
			t.Errorf("release workflow validation missing transformer output check %q", check)
		}
	}
}

func releaseWorkflowRunBlock(t *testing.T) string {
	t.Helper()
	_, testFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("locate workflow regression test")
	}
	workflowPath := filepath.Join(filepath.Dir(testFile), "..", "..", ".github", "workflows", "release.yml")
	content, err := os.ReadFile(workflowPath)
	if err != nil {
		t.Fatalf("read release workflow: %v", err)
	}

	const step = "      - name: Update Homebrew cask and formula\n        run: |\n"
	start := strings.Index(string(content), step)
	if start == -1 {
		t.Fatal("release workflow is missing the Homebrew publication step")
	}
	runBlock := string(content)[start+len(step):]
	if end := strings.Index(runBlock, "        env:\n"); end != -1 {
		runBlock = runBlock[:end]
	}
	return runBlock
}

func assertFailFastCommand(t *testing.T, workflow, command string) {
	t.Helper()
	position := strings.Index(workflow, command)
	if position == -1 {
		t.Fatalf("Homebrew publication run block is missing command %q", command)
	}
	lineStart := strings.LastIndex(workflow[:position], "\n") + 1
	lineEnd := strings.Index(workflow[position:], "\n")
	if lineEnd == -1 {
		lineEnd = len(workflow)
	} else {
		lineEnd += position
	}
	if strings.TrimSpace(workflow[lineStart:lineEnd]) != command {
		t.Fatalf("command %q must be a standalone fail-fast command", command)
	}
}

func assertValidationFailureExits(t *testing.T, workflow, validation string) {
	t.Helper()
	start := strings.Index(workflow, validation)
	if start == -1 {
		t.Fatalf("Homebrew publication run block is missing validation %q", validation)
	}
	blockEnd := strings.Index(workflow[start:], "\n          fi")
	if blockEnd == -1 {
		t.Fatalf("validation %q is missing its closing conditional", validation)
	}
	block := strings.TrimSpace(workflow[start : start+blockEnd])
	lastLine := block[strings.LastIndex(block, "\n")+1:]
	if strings.TrimSpace(lastLine) != "exit 1" {
		t.Fatalf("validation %q must exit before publication", validation)
	}
}
