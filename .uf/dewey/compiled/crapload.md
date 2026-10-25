---
tier: validated
compiled_at: 2026-10-25T16:40:42Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - ci-1
topic: crapload
---

# Crapload

## Current State (October 2026)

CRAPload (Change Risk Anti-Patterns) is gaze's core quality metric. The
August 2026 compile's central premise has flipped, and two proposed fixes
never landed on main.

### Premise correction: `gaze crap` no longer runs `-short`

`--test-short` is opt-in and defaults FALSE for `gaze crap`; only `gaze
self-check` defaults to `-short`. Short()-guarded tests now contribute
coverage to normal CRAPload runs — the August zero-coverage guidance
described the old default.

### Current regression-gating model

- CI delegates CRAP analysis to the pinned `complytime/org-infra`
  `reusable_crapload_analysis.yml` (SHA pinned in `ci_crapload.yml`).
- The reference is a manually committed `.gaze/baseline.json`,
  regenerated via `make crapload-baseline`.
- `make crapload-check` compares current vs baseline with a strict `>`
  (`bc -l`); new functions get a separate threshold.

### Never-merged proposals (do not cite as current)

The epsilon-0.5 comparison tolerance and CI-runner baseline regeneration
exist only on unmerged `origin/036-ci-crap-baseline`; main never contained
them. Cross-platform coverage divergence (platform-conditional paths)
remains the documented cause of historical CI CRAP false regressions.

### testing.Short() convention

The proposed "no Short() on sub-1s tests" pack rule was never adopted. The
landed rule is go.md TC-011: guard slow tests (subprocess execution,
full-module analysis) with `testing.Short()` — guards only for genuinely
slow tests.

### Verified code-anchored guidance (still TRUE)

- Cross-package deduplication: `goprovider.LoadTestPackage` is exported,
  validates `pkg.Errors`, and is reused by aireport; consolidation fixed
  a latent bug (aireport's copy lacked validation).
- DI for heavy-I/O orchestrators: `contractCoverageDeps` carries 4
  injectable fields including `buildCoverageMapFn` and `aiMapperFn`.
  Inject ALL data-producing internal helpers. Gotcha: Go disallows two
  variadic params — absorb `aiMapperFn` into the deps struct.
- AST testing: `parseAndTypeCheck` with `Importer:nil` tests AST-walking
  functions without full type resolution.
- Bubble Tea: `Update` tests as a pure function — execute the returned
  `cmd()`, then assert on the `msg` type.
- Structural dead branches: `isPointerArgStore`'s `tracesToParam`
  Swiss-Army helper catches all real SSA cases, capping coverage at
  ~50%; fix via structural decomposition.

## History

- 11 gaze crapload learnings (yvonne-devlin); the August compile's
  history line said 9 — its own intro already said 11.
- Point-in-time metrics from the Short()-guard discovery (historical
  data, not current measurements):
  - `ResolvePackagePaths`: CRAPload 81.6 → 10.1 after removing 12 lines
    of Short() guards (sub-second `packages.NeedName` mode).
  - `packages.Load`: 38 → 32 with DI — genuinely slow filesystem I/O
    where injection, not guard removal, applies.
  - `BuildContractCoverageFunc`: complexity 22 → 7 via extraction.
  - `matchContainerUnwrap`: 50 → 8; extracted core `traceForwardDataFlow`
    retained 32. Expect 60-70% complexity retention in AST cores.
- unbound-force ci-1: CI CRAP regression analysis; root cause was
  cross-platform coverage divergence, not float precision.
- gaze ci-gate-integrity: `*int` for nil-vs-zero distinction.
