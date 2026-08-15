---
tier: validated
compiled_at: 2026-08-14T19:58:31Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - ci-1
topic: ci-coverage
related: crapload, fail-fast
---

# Theme: CI Coverage and Quality Gates

## Current State (August 2026)

CI pipeline patterns from replicator and gaze repos reveal common pitfalls in coverage ratchets, CRAP score tracking, and quality gate configuration.

## Coverage Ratchet Pattern

### Implementation (replicator)
```bash
go tool cover -func coverage.out | grep -E "package_name" | awk '{sum+=$NF; c++} END {if (c>0) print sum/c; else print 0}'
```
Compare with `bc -l` and `declare -A THRESHOLDS` per-package.

### Guards Required
1. `[ ! -s coverage.out ]` — empty coverage file
2. `[ -z "$GLOBAL_COV" ]` — empty computed coverage (bc silent pass)
3. `awk END { if (c>0) }` — renamed/removed package produces 0 lines (division by zero)
4. Thin MCP wrapper packages (`internal/tools/*`: org, forge, comms, memory, registry) at 0% are excluded from per-package ratchets; set global floor instead (55%, state 58.4%)

## CRAP Score Tracking

### Cross-Platform Divergence
CI CRAP regressions are caused by cross-platform coverage divergence (platform-conditional code paths), NOT float precision errors. Fix:
1. Baseline on CI runner (not local machine)
2. Add epsilon tolerance `ε=0.5` in `ci_crapload.yml`

### testing.Short() Impact
`gaze crap` runs `go test -short -coverprofile` internally. Short-guarded tests = zero coverage contribution. This is the single largest source of inflated CRAPload scores.

## Two-Tier Baseline (ci-causality-soft-gate)

For failure detection, use two-tier baseline:
1. **CI API**: `gh api .../check-runs` for recent passing baselines
2. **Git worktree**: Fallback when API unavailable
3. Only failing tools need baseline comparison (skip passing ones)

### Skill Mode Design
New skill mode > extending existing mode with optional parameters. Each mode should have one unambiguous behavior (ci-causality-soft-gate learning).

## Quality Gate Anti-Patterns

1. **Don't gate on unstable values**: stderr output format changes across tool versions
2. **Don't mix pass/fail semantics**: `int` 0 can mean "passed with zero" or "no data" — use `*int`
3. **Don't assume ordering**: CI check names, Homebrew cask fields, awk output can reorder

## History
- replicator ci-coverage-ratchets (3): Per-package ratchet implementation
- unbound-force ci-1: Cross-platform CRAP divergence
- unbound-force ci-causality-soft-gate (2): Two-tier baseline, skill mode design
- gaze ci-gate-integrity (3): int→*int blast radius
