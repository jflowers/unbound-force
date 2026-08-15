---
tier: validated
compiled_at: 2026-08-14T19:57:42Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - ci-1
topic: di-testability
related: crapload, go-patterns
---

# Theme: Dependency Injection for Testability

## Current State (August 2026)

DI patterns appear across all Go repos as the primary mechanism for making code testable without external dependencies. 15+ learnings reinforce a consistent hierarchy of DI approaches.

## DI Hierarchy (Simplest First)

### 1. Injectable Function Parameter
For single call sites with one behavior variant:
```go
func resolveAuthor(gitResolver func() (string, error)) (string, error)
```
Lightweight, no interface declaration needed. Used in dewey (resolveAuthor), gaze (various CRAPload optimizations).

### 2. Deps Struct
When multiple injectable behaviors accumulate:
```go
type Deps struct {
    LoadPackages    func(cfg *packages.Config, patterns ...string) ([]*packages.Package, error)
    BuildCoverageMap func(...) map[string]float64
    AIMapperFn      func(...) ([]Mapping, error)
}
```
Go disallows multiple variadic parameters — absorb additional function params into deps struct. Used extensively in gaze CRAPload optimizations.

### 3. Full Interface
When multiple behaviors are needed across multiple call sites:
```go
type TokenRefresher interface {
    Refresh(ctx context.Context) (*Token, error)
    Available() bool
}
```
Used for gateway providers, sandbox backends, MCP clients.

### 4. Injectable Constants
`runtime.GOOS` is compile-time constant — inject as `GOOS string` or `Platform *PlatformConfig`:
```go
type Options struct {
    GOOS     string // defaults to runtime.GOOS
    Platform *PlatformConfig
}
```
Required for doctor cross-platform checks and sandbox backend detection.

### 5. Command Execution
For shell-out testing, inject the exec function:
```go
type ExecCommandFunc func(name string, args ...string) *exec.Cmd
```
Used in gateway (gcloud auth), with `sync.RWMutex` double-check cache pattern.

## CRAPload-Specific DI

The gaze CRAPload series proved that DI is the primary tool for reducing CRAPload scores on I/O-heavy functions:

1. Identify the I/O dependency (filesystem, network, subprocess)
2. Extract into injectable function/deps field
3. Tests use synthetic data, run WITHOUT `-short` flag
4. CRAPload drops because coverage increases without complexity change

**Key insight**: When adding DI to orchestrator functions, inject ALL data-producing internal helpers, not just cross-package ones. Missing one (`buildCoverageMapFn`) required a follow-up change.

## Test Helper Patterns

- `parseAndTypeCheck` helper with `Importer: nil` for AST function unit tests
- Bubble Tea `Update` tested as pure function (execute `cmd()`, check `msg` type)
- `httptest.Server` + `sync/atomic` counters for stateful HTTP polling tests
- Configurable poll intervals for time-dependent tests

## Anti-Patterns

1. **Don't add DI Options fields without test stubs**: New `ResolveRelease` field broke 6 tests with nil panic
2. **Don't use `testing.Short()` as a substitute for DI**: Short-guarded tests contribute zero CRAPload coverage
3. **Don't mix DI levels**: If you have a deps struct, don't also accept the same function as a variadic param

## History
- go-patterns-1: Injectable function parameter
- gaze crapload series (9 files): DI for CRAPload reduction
- unbound-force sandbox-4, doctor-1: Platform/GOOS injection
- dewey remote-llm-provider: ExecCommandFunc pattern
- replicator mcpclient: Config struct DI
