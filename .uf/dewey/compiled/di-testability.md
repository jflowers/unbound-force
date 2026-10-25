---
tier: validated
compiled_at: 2026-10-25T16:40:49Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - ci-1
topic: di-testability
---

# DI Testability

## Current State (October 2026)

DI remains the primary mechanism for making Go code testable
without external dependencies; the five-level hierarchy is
fully alive. Drifted examples corrected per learnings-review-2026-10.

## DI Hierarchy (Simplest First)

### 1. Injectable Function Parameter
Single call site, one behavior variant — no interface needed:
```go
func resolveAuthor(gitResolver func() (string, error)) string
```
dewey's resolveAuthor (tools/learning.go:126) now returns `string` only.

### 2. Deps Struct
When injectable behaviors accumulate (Go disallows multiple variadic
parameters); the old generic gaze `type Deps struct` no longer exists:
- `contractCoverageDeps{loadAndAnalyze, classifyResults,
  loadTestPkg, assess, aiMapperFn}` — goprovider/contract.go:299
- `qualityPipelineDeps` — gaze aireport/runner_steps.go:38,
  variadic nil-means-default resolution

### 3. Full Interface
Multiple behaviors across multiple call sites; the old
`TokenRefresher` example exists in no repo. Current interfaces:
- gateway `Provider` (internal/gateway/provider.go:43):
  Name/PrepareRequest/Start — strategy pattern
- sandbox `Backend` (internal/sandbox/backend.go:37):
  Create/Start/Stop/Destroy

### 4. Injectable Constants
`runtime.GOOS` is compile-time — inject overrides:
```go
GOOS     string           // doctor.go:73, resolved via goos()
Platform *PlatformConfig  // sandbox.go:140
```
Needed for doctor cross-platform checks; tests inject macOS on Linux CI.

### 5. Command Execution
Shell-out injection. The gateway field is an unnamed function
type (provider.go:181), not a named `ExecCommandFunc *exec.Cmd`:
```go
execCmd func(string, ...string) ([]byte, error)
```
Token cache: `tokenMu sync.RWMutex` + `tokenRefreshing` TryLock dedup.

## CRAPload-Specific DI

1. Identify the I/O dependency (filesystem, network, subprocess)
2. Extract into an injectable function/deps field
3. Tests use synthetic data, run without `-short`
4. CRAPload drops: coverage rises, complexity unchanged
5. Key insight: inject ALL data-producing internal helpers, not
   just cross-package — missing `buildCoverageMapFn` cost a follow-up

## Test Helper Patterns

- `httptest.Server` + `sync/atomic` counters for stateful polling
- Configurable intervals: `var refreshMinute = time.Minute`
  (gateway refresh.go:20-23) — var, not const, so tests override
- replicator mcpclient `Config` struct DI (client.go:26)

## Anti-Patterns

1. DI fields without test stubs — `ResolveRelease` nil-panicked 6 tests
2. `testing.Short()` is not DI — zero CRAPload coverage from short guards
3. Mixing DI levels — deps struct plus same function as variadic param

## History

- go-patterns-1: injectable function parameter
- gaze CRAPload series (9 files): DI for CRAPload reduction
- unbound-force sandbox-4, doctor-1: Platform/GOOS injection
- dewey: exec injection; replicator mcpclient: Config struct DI
- Compiled 2026-08-14; rewritten Oct 2026 per the October audit:
  gaze deps renamed, TokenRefresher removed, exec signature fixed.
