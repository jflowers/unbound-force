package artifacts_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/unbound-force/unbound-force/internal/artifacts"
)



func TestFindArtifacts_MatchesType(t *testing.T) {
	dir := t.TempDir()
	// Write 2 artifacts with different types
	if err := artifacts.WriteArtifact(dir, "gaze", "quality-report", "r1", map[string]string{"score": "A"}); err != nil {
		t.Fatal(err)
	}
	if err := artifacts.WriteArtifact(dir, "divisor", "review-verdict", "v1", map[string]string{"decision": "approve"}); err != nil {
		t.Fatal(err)
	}

	paths, err := artifacts.FindArtifacts(dir, "quality-report")
	if err != nil {
		t.Fatal(err)
	}
	if len(paths) != 1 {
		t.Fatalf("expected 1 quality-report, got %d", len(paths))
	}
}

func TestFindArtifacts_EmptyDir(t *testing.T) {
	dir := t.TempDir()
	paths, err := artifacts.FindArtifacts(dir, "quality-report")
	if err != nil {
		t.Fatal(err)
	}
	if len(paths) != 0 {
		t.Errorf("expected 0 artifacts in empty dir, got %d", len(paths))
	}
}

func TestFindArtifacts_SkipsNonJSON(t *testing.T) {
	dir := t.TempDir()
	// Write a non-JSON file
	_ = os.WriteFile(filepath.Join(dir, "readme.md"), []byte("# hello"), 0644) //nolint:errcheck // test setup
	// Write a valid artifact
	_ = artifacts.WriteArtifact(dir, "gaze", "quality-report", "r1", map[string]string{}) //nolint:errcheck // test setup

	paths, err := artifacts.FindArtifacts(dir, "quality-report")
	if err != nil {
		t.Fatal(err)
	}
	if len(paths) != 1 {
		t.Errorf("expected 1 artifact (skipping .md), got %d", len(paths))
	}
}

func TestReadEnvelope_ValidFile(t *testing.T) {
	dir := t.TempDir()
	_ = artifacts.WriteArtifact(dir, "divisor", "review-verdict", "v1", map[string]string{"decision": "approve"}) //nolint:errcheck // test setup

	// Find the written file
	paths, _ := artifacts.FindArtifacts(dir, "review-verdict")
	if len(paths) == 0 {
		t.Fatal("no artifact found")
	}

	env, err := artifacts.ReadEnvelope(paths[0])
	if err != nil {
		t.Fatal(err)
	}
	if env.Hero != "divisor" {
		t.Errorf("Hero = %q, want divisor", env.Hero)
	}
	if env.ArtifactType != "review-verdict" {
		t.Errorf("Type = %q, want review-verdict", env.ArtifactType)
	}
}

func TestReadEnvelope_MalformedFile(t *testing.T) {
	dir := t.TempDir()
	_ = os.WriteFile(filepath.Join(dir, "bad.json"), []byte("{invalid json"), 0644) //nolint:errcheck // test setup
	_, err := artifacts.ReadEnvelope(filepath.Join(dir, "bad.json"))
	if err == nil {
		t.Error("expected error for malformed JSON")
	}
}

func TestWriteArtifact_WithContext(t *testing.T) {
	dir := t.TempDir()
	ctx := &artifacts.ArtifactContext{
		Branch:        "feat/health-check",
		Commit:        "abc123",
		BacklogItemID: "BI-042",
		CorrelationID: "corr-001",
		WorkflowID:    "wf-feat-health-check-20260320",
	}

	err := artifacts.WriteArtifactWithContext(dir, "gaze", "quality-report", "qr-001", map[string]string{"score": "A"}, ctx)
	if err != nil {
		t.Fatalf("WriteArtifactWithContext failed: %v", err)
	}

	paths, err := artifacts.FindArtifacts(dir, "quality-report")
	if err != nil {
		t.Fatalf("FindArtifacts failed: %v", err)
	}
	if len(paths) != 1 {
		t.Fatalf("expected 1 artifact, got %d", len(paths))
	}

	env, err := artifacts.ReadEnvelope(paths[0])
	if err != nil {
		t.Fatalf("ReadEnvelope failed: %v", err)
	}

	if env.Context == nil {
		t.Fatal("expected non-nil Context")
	}

	var readCtx artifacts.ArtifactContext
	if err := json.Unmarshal(env.Context, &readCtx); err != nil {
		t.Fatalf("unmarshal context: %v", err)
	}

	if readCtx.Branch != "feat/health-check" {
		t.Errorf("Branch = %q, want %q", readCtx.Branch, "feat/health-check")
	}
	if readCtx.WorkflowID != "wf-feat-health-check-20260320" {
		t.Errorf("WorkflowID = %q, want %q", readCtx.WorkflowID, "wf-feat-health-check-20260320")
	}
	if readCtx.BacklogItemID != "BI-042" {
		t.Errorf("BacklogItemID = %q, want %q", readCtx.BacklogItemID, "BI-042")
	}
	if readCtx.Commit != "abc123" {
		t.Errorf("Commit = %q, want %q", readCtx.Commit, "abc123")
	}
	if readCtx.CorrelationID != "corr-001" {
		t.Errorf("CorrelationID = %q, want %q", readCtx.CorrelationID, "corr-001")
	}
}

func TestWriteArtifact_WithNilContext(t *testing.T) {
	dir := t.TempDir()

	err := artifacts.WriteArtifactWithContext(dir, "gaze", "quality-report", "qr-002", map[string]string{"score": "B"}, nil)
	if err != nil {
		t.Fatalf("WriteArtifactWithContext with nil context failed: %v", err)
	}

	paths, err := artifacts.FindArtifacts(dir, "quality-report")
	if err != nil {
		t.Fatalf("FindArtifacts failed: %v", err)
	}
	if len(paths) != 1 {
		t.Fatalf("expected 1 artifact, got %d", len(paths))
	}

	env, err := artifacts.ReadEnvelope(paths[0])
	if err != nil {
		t.Fatalf("ReadEnvelope failed: %v", err)
	}

	// Context should be empty/nil when no context provided
	if len(env.Context) > 0 {
		t.Errorf("expected empty Context for nil input, got %s", string(env.Context))
	}
}

func TestFindArtifactsByHero_FiltersCorrectly(t *testing.T) {
	dir := t.TempDir()

	// Write artifacts from different heroes
	if err := artifacts.WriteArtifact(dir, "gaze", "quality-report", "qr-1", map[string]string{"score": "A"}); err != nil {
		t.Fatal(err)
	}
	if err := artifacts.WriteArtifact(dir, "divisor", "quality-report", "qr-2", map[string]string{"score": "B"}); err != nil {
		t.Fatal(err)
	}
	if err := artifacts.WriteArtifact(dir, "gaze", "quality-report", "qr-3", map[string]string{"score": "C"}); err != nil {
		t.Fatal(err)
	}

	paths, err := artifacts.FindArtifactsByHero(dir, "quality-report", "gaze")
	if err != nil {
		t.Fatalf("FindArtifactsByHero failed: %v", err)
	}
	if len(paths) != 2 {
		t.Errorf("expected 2 gaze quality-reports, got %d", len(paths))
	}

	// Verify divisor is excluded
	pathsDivisor, err := artifacts.FindArtifactsByHero(dir, "quality-report", "divisor")
	if err != nil {
		t.Fatalf("FindArtifactsByHero failed: %v", err)
	}
	if len(pathsDivisor) != 1 {
		t.Errorf("expected 1 divisor quality-report, got %d", len(pathsDivisor))
	}
}

func TestFindArtifactsSince_FiltersByTime(t *testing.T) {
	dir := t.TempDir()

	// Write two artifacts (both will have current timestamp)
	if err := artifacts.WriteArtifact(dir, "gaze", "quality-report", "qr-old", map[string]string{}); err != nil {
		t.Fatal(err)
	}
	if err := artifacts.WriteArtifact(dir, "gaze", "quality-report", "qr-new", map[string]string{}); err != nil {
		t.Fatal(err)
	}

	// Since a time in the past should return all
	past := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
	paths, err := artifacts.FindArtifactsSince(dir, "quality-report", past)
	if err != nil {
		t.Fatalf("FindArtifactsSince failed: %v", err)
	}
	if len(paths) != 2 {
		t.Errorf("expected 2 artifacts since 2020, got %d", len(paths))
	}

	// Since a time in the future should return none
	future := time.Date(2030, 1, 1, 0, 0, 0, 0, time.UTC)
	pathsFuture, err := artifacts.FindArtifactsSince(dir, "quality-report", future)
	if err != nil {
		t.Fatalf("FindArtifactsSince failed: %v", err)
	}
	if len(pathsFuture) != 0 {
		t.Errorf("expected 0 artifacts since 2030, got %d", len(pathsFuture))
	}
}

func TestCheckSchemaVersion_Compatible(t *testing.T) {
	env := &artifacts.Envelope{SchemaVersion: "1.0.0"}

	// Exact match
	compat, warn := artifacts.CheckSchemaVersion(env, "1.0.0")
	if !compat {
		t.Error("expected compatible for exact match")
	}
	if warn != "" {
		t.Errorf("expected no warning for exact match, got %q", warn)
	}

	// Minor version differs
	compat, warn = artifacts.CheckSchemaVersion(env, "1.1.0")
	if !compat {
		t.Error("expected compatible for minor version difference")
	}
	if warn == "" {
		t.Error("expected warning for minor version difference")
	}
}

func TestCheckSchemaVersion_MajorMismatch(t *testing.T) {
	env := &artifacts.Envelope{SchemaVersion: "2.0.0"}

	compat, warn := artifacts.CheckSchemaVersion(env, "1.0.0")
	if compat {
		t.Error("expected incompatible for major version mismatch")
	}
	if warn == "" {
		t.Error("expected warning for major version mismatch")
	}
}

func TestWriteArtifact_CustomHero(t *testing.T) {
	dir := t.TempDir()
	err := artifacts.WriteArtifact(dir, "gaze", "quality-report", "qr-001", map[string]string{"v": "1"})
	if err != nil {
		t.Fatal(err)
	}

	paths, _ := artifacts.FindArtifacts(dir, "quality-report")
	if len(paths) != 1 {
		t.Fatal("expected 1 artifact")
	}

	env, _ := artifacts.ReadEnvelope(paths[0])
	if env.Hero != "gaze" {
		t.Errorf("Hero = %q, want gaze", env.Hero)
	}
}
