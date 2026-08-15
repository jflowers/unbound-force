---
tier: validated
compiled_at: 2026-08-14T19:54:32Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - go-patterns-1
  - go-patterns-20260510T173314-jay-flowers
  - go-patterns-20260510T173319-jay-flowers
topic: go-patterns
related: di-testability, sandbox
---

# Go Implementation Patterns

## Current State (August 2026)

Cross-cutting Go patterns discovered across unbound-force, dewey, gaze, and replicator repos. 3 learnings in unbound-force cluster; additional patterns from other repos reinforce these.

## Terminal I/O

### fmt.Fscanln is Broken for Interactive Prompts
`fmt.Fscanln` blocks on bare CR (`0x0D`) which macOS/iTerm2 can produce. **Always use `bufio.NewScanner` + `Scan()` + `Text()` instead.** This handles `\n`, `\r\n`, and bare `\r` correctly, plus clean EOF detection.

**Convention pack candidate**: Ban `fmt.Fscanln`/`fmt.Scanln` for interactive input.

## Dependency Injection Patterns

### Injectable Function Parameter (Lightweight DI)
When only one call site needs one behavior variant, use an injectable function parameter:
```go
func resolveAuthor(gitResolver func() (string, error)) (string, error)
```
This is a lightweight alternative to a full interface. Reserve full interfaces for types with multiple behaviors.

### Injectable Platform Constants
`runtime.GOOS` is a compile-time constant and cannot be overridden in tests. Inject `GOOS string` or `Platform *PlatformConfig` struct to enable cross-platform test coverage.

### Options Struct with Optional Pointers
For functions needing aggregate statistics without changing the core signature, use optional pointer fields in the Options struct:
```go
type ScanInput struct {
    // ... core fields
    SourceStats *SourceStats // optional, populated if non-nil
}
```

## Constructor Patterns
- `*T → (*T, error)`: Mechanical change; compiler finds all call sites. Use when constructors can fail.
- Adding a new `Options` field breaks all test struct literals with nil panics — always add stubs.

## Error Handling
- Wrap errors with context: `fmt.Errorf("context: %w", err)`
- `errors.As` can be dropped when implementation simplifies — update design artifacts to match

## Struct Literal Maintenance
When adding fields to widely-used structs (gateway config, sandbox options, setup options), grep ALL struct literal sites. Common counts: 6-8 test files need updating. Zero-value gotchas: `time.Time{}` is in the past, `*int` nil means "unavailable" not "zero".

## History
- go-patterns-1: Injectable function parameters
- go-patterns-20260510: bufio.Scanner, platform injection
- stdin-prompt-1: fmt.Fscanln detailed failure analysis
