package main

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/unbound-force/unbound-force/internal/sandbox"
)

// TestApplySandboxConfig_UIDMap verifies that applySandboxConfig
// propagates UIDMap from config to opts when the CLI flag is not
// set, and that the CLI flag takes precedence over config.
func TestApplySandboxConfig_UIDMap(t *testing.T) {
	// Create a temp project dir with .uf/config.yaml
	// containing uid_map: true.
	dir := t.TempDir()
	ufDir := filepath.Join(dir, ".uf")
	if err := os.MkdirAll(ufDir, 0o755); err != nil {
		t.Fatal(err)
	}
	cfgData := []byte("sandbox:\n  uid_map: true\n")
	if err := os.WriteFile(filepath.Join(ufDir, "config.yaml"), cfgData, 0o644); err != nil {
		t.Fatal(err)
	}

	// Test 1: Config sets UIDMap when CLI flag is not set.
	opts := sandbox.Options{
		ProjectDir: dir,
		UIDMap:     false,
	}
	var stderr bytes.Buffer
	applySandboxConfig(&opts, &stderr)
	if !opts.UIDMap {
		t.Error("expected UIDMap=true from config when CLI flag not set")
	}

	// Test 2: CLI flag (UIDMap=true) takes precedence — already true,
	// config should not change it.
	opts2 := sandbox.Options{
		ProjectDir: dir,
		UIDMap:     true,
	}
	applySandboxConfig(&opts2, &stderr)
	if !opts2.UIDMap {
		t.Error("expected UIDMap=true preserved when CLI flag already set")
	}

	// Test 3: Config with uid_map: false (default) does not
	// override CLI flag.
	dir2 := t.TempDir()
	ufDir2 := filepath.Join(dir2, ".uf")
	if err := os.MkdirAll(ufDir2, 0o755); err != nil {
		t.Fatal(err)
	}
	cfgData2 := []byte("sandbox:\n  uid_map: false\n")
	if err := os.WriteFile(filepath.Join(ufDir2, "config.yaml"), cfgData2, 0o644); err != nil {
		t.Fatal(err)
	}
	opts3 := sandbox.Options{
		ProjectDir: dir2,
		UIDMap:     true,
	}
	applySandboxConfig(&opts3, &stderr)
	if !opts3.UIDMap {
		t.Error("expected UIDMap=true preserved when config has uid_map: false")
	}
}

// --- Destroy confirmation tests (Task 6.4/D14) ---

func TestRunSandboxDestroy_EmptyInputCancels(t *testing.T) {
	var stdout bytes.Buffer
	p := sandboxDestroyParams{
		projectDir: "/tmp/test",
		yes:        false,
		stdout:     &stdout,
		stderr:     &bytes.Buffer{},
		stdin:      strings.NewReader("\n"),
	}
	err := runSandboxDestroy(p)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(stdout.String(), "Cancelled.") {
		t.Errorf("expected 'Cancelled.' in output, got: %s", stdout.String())
	}
}

func TestRunSandboxDestroy_EOFCancels(t *testing.T) {
	var stdout bytes.Buffer
	p := sandboxDestroyParams{
		projectDir: "/tmp/test",
		yes:        false,
		stdout:     &stdout,
		stderr:     &bytes.Buffer{},
		stdin:      strings.NewReader(""),
	}
	err := runSandboxDestroy(p)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(stdout.String(), "Cancelled.") {
		t.Errorf("expected 'Cancelled.' on EOF, got: %s", stdout.String())
	}
}

func TestRunSandboxDestroy_NoCancels(t *testing.T) {
	var stdout bytes.Buffer
	p := sandboxDestroyParams{
		projectDir: "/tmp/test",
		yes:        false,
		stdout:     &stdout,
		stderr:     &bytes.Buffer{},
		stdin:      strings.NewReader("n\n"),
	}
	err := runSandboxDestroy(p)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(stdout.String(), "Cancelled.") {
		t.Errorf("expected 'Cancelled.' on 'n', got: %s", stdout.String())
	}
}
