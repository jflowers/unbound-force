---
tier: validated
compiled_at: 2026-08-14T19:55:27Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - ci-1
topic: crapload
related: di-testability, blast-radius-scope-audit, ci-coverage
---

# CRAPload Optimization: testing.Short() and Coverage

## Current State (August 2026)

CRAPload (Change Risk Anti-Patterns) is gaze's core quality metric. 11 learnings across gaze capture the most impactful optimization discovery: `testing.Short()` guards silently destroy coverage when `gaze crap` runs tests internally.

## The Core Problem

`gaze crap` runs `go test -short -coverprofile` internally. Any test guarded by `testing.Short()` contributes ZERO coverage to the CRAPload calculation. This means functions that ARE well-tested appear to have no coverage.

## Highest-ROI Fix: Delete Unnecessary Short() Guards

The single highest-impact optimization is removing `testing.Short()` guards from tests that don't need them:

**Example**: `ResolvePackagePaths` — CRAPload dropped from **81.6 → 10.1** with zero code changes, only 12 lines of `testing.Short()` guards removed. The function's `packages.NeedName` mode runs sub-second and never warranted a guard.

**Rule**: Only use `testing.Short()` for tests that genuinely take >1 second or require external resources.

## DI for Heavy-I/O Functions

When `testing.Short()` IS warranted (e.g., `packages.Load` doing real filesystem I/O), inject dependencies so tests can use synthetic data WITHOUT the `-short` flag:
- `packages.Load` CRAPload: 38 → 32 with DI
- When adding DI to orchestrator functions, inject ALL data-producing internal helpers, not just cross-package ones (e.g., `BuildContractCoverageFunc` needed a 4th field `buildCoverageMapFn`)

## Decomposition for Complex Functions

High-complexity functions benefit from extraction by distinct concern:
- `BuildContractCoverageFunc`: complexity 22 → 7
- `matchContainerUnwrap`: complexity 50 → 8 (but extracted core `traceForwardDataFlow` retained complexity 32)
- **Expect 60-70% complexity retention in AST analysis cores** — they are inherently complex

## Structural Unreachable Branches

Some functions have structurally unreachable branches that cap coverage regardless of test quality:
- `isPointerArgStore`: `tracesToParam` Swiss-Army function catches all real SSA cases, capping coverage at 50%
- Fix: structural decomposition to eliminate dead branches

## Cross-Package Deduplication

Compare similar functions across packages line-by-line:
- `goprovider.loadTestPackage` had `pkg.Errors` validation that `aireport` lacked = latent bug
- Consolidating to `goprovider.LoadTestPackage` fixed the bug and reduced maintenance surface

## Technical Gotchas
- Variadic + deps struct conflict: Go disallows 2 variadic params — absorb `aiMapperFn` into deps struct
- `parseAndTypeCheck` test helper with `Importer:nil` for AST function testing
- Bubble Tea `Update` can be tested as a pure function: execute `cmd()`, check `msg` type
- CI CRAP regressions from cross-platform coverage divergence (platform-conditional paths), not float precision — fix: baseline on CI runner + epsilon ε=0.5

## Convention Pack Candidate

**Proposed rule**: "SHOULD NOT use `testing.Short()` guards on tests that complete in under 1 second. `gaze crap` runs with `-short`, so guarded tests contribute zero coverage."

## History
- gaze crapload-* series (yvonne-devlin, 9 files): Core Short() discovery and DI patterns
- unbound-force ci-1: CI CRAP regression analysis
- gaze ci-gate-integrity: *int for nil-vs-zero distinction
