---
title: CI-Generated CRAP Baseline
status: draft
created: 2026-05-03
spec: "036"
---

# Feature Specification: CI-Generated CRAP Baseline

**Feature Branch**: `036-ci-crap-baseline`
**Created**: 2026-05-03
**Status**: Draft
**Input**: CI-generated CRAP baseline with epsilon
tolerance for cross-platform score stability

## User Scenarios & Testing

### User Story 1 — Automated Baseline Generation (Priority: P1)

As a maintainer, I want the CRAP baseline to be
regenerated automatically on the CI environment after
each merge to main, so that CRAP score comparisons on
pull requests are always apples-to-apples (same OS,
same architecture, same tool availability) and do not
produce false regressions from cross-platform coverage
differences.

**Why this priority**: This is the root fix. The current
baseline is generated locally on macOS ARM, but CI
compares on Ubuntu x86_64. Platform-conditional code
paths (macOS/Linux branches, tool availability via
LookPath) produce different coverage percentages on
each platform, leading to different CRAP scores. Seven
false regressions were detected on PR #151 solely
because the baseline was generated on a different
platform than CI.

**Independent Test**: Merge a PR to main, verify that a
CI job runs gaze analysis and commits an updated
baseline file. Open a subsequent PR and verify the
CRAP Load Analysis comparison produces zero false
regressions from platform differences.

**Acceptance Scenarios**:

1. **Given** a PR is merged to main, **When** the
   post-merge workflow runs, **Then** the baseline file
   is regenerated using the same runner OS and Go
   version as the CRAP Load Analysis PR check
2. **Given** the baseline was regenerated on CI,
   **When** a new PR is opened with no code changes,
   **Then** the CRAP Load Analysis reports zero
   regressions (no platform-induced false positives)
3. **Given** the baseline update workflow runs, **When**
   the new baseline is identical to the existing one,
   **Then** no commit is created (no empty diff commits)
4. **Given** the baseline update workflow runs, **When**
   it commits the updated baseline, **Then** the commit
   does not trigger recursive CI runs

---

### User Story 2 — Epsilon Tolerance for CRAP Regressions (Priority: P2)

As a maintainer, I want CRAP score regressions below a
configurable threshold (default 0.5) to be treated as
noise rather than failures, so that minor CRAP
fluctuations from Go toolchain updates, test ordering
changes, or coverage instrumentation variance do not
block pull requests.

**Why this priority**: Even with CI-generated baselines,
minor CRAP fluctuations can occur from Go patch version
differences or non-deterministic coverage measurement.
An epsilon tolerance provides defense-in-depth against
false regressions that the baseline fix alone may not
catch.

**Independent Test**: Artificially modify a function to
increase its CRAP score by 0.3. Verify the CRAP Load
Analysis does not flag it as a regression. Then modify
to increase by 1.0. Verify it IS flagged.

**Acceptance Scenarios**:

1. **Given** a function's CRAP score increased by 0.3
   compared to baseline, **When** the CRAP Load
   Analysis runs, **Then** the function is NOT reported
   as a regression
2. **Given** a function's CRAP score increased by 1.0
   compared to baseline, **When** the CRAP Load
   Analysis runs, **Then** the function IS reported
   as a regression
3. **Given** the epsilon is configured as 0.5, **When**
   a function's CRAP score increases by exactly 0.5,
   **Then** the function is NOT reported as a regression
   (boundary: delta must be strictly greater than
   epsilon)

---

### Edge Cases

- What happens when the post-merge baseline update
  fails (e.g., gaze binary unavailable, tests fail)?
  The workflow SHOULD log the failure and continue
  without updating the baseline. The stale baseline
  remains until the next successful run.
- What happens when multiple PRs merge to main in
  rapid succession? The concurrency group ensures only
  one baseline update runs at a time. Later pushes
  cancel in-progress runs.
- What happens when the baseline file is manually
  edited on a branch? The CI-generated baseline on main
  overwrites any manual edits on the next merge. This
  is intentional — the CI baseline is the source of
  truth.
- What happens when gaze is upgraded and CRAP formula
  changes? The post-merge baseline update automatically
  captures the new scores. No manual intervention
  needed.

## Requirements

### Functional Requirements

- **FR-001**: A CI workflow MUST run after each push to
  main that regenerates the CRAP baseline file using
  the same runner environment (OS, Go version, gaze
  version) as the CRAP Load Analysis PR check
- **FR-002**: The baseline workflow MUST NOT create
  empty commits when the baseline is unchanged
- **FR-003**: The baseline workflow MUST use a commit
  message marker (e.g., `[skip ci]` or `[baseline]`)
  that prevents recursive CI triggers
- **FR-004**: The baseline workflow MUST use a
  concurrency group to prevent multiple simultaneous
  baseline updates
- **FR-005**: The CRAP Load Analysis PR check MUST
  support a configurable epsilon tolerance for
  regression detection
- **FR-006**: The default epsilon tolerance MUST be 0.5
  CRAP score points — deltas at or below this threshold
  are treated as noise
- **FR-007**: The epsilon MUST apply to both CRAP and
  GazeCRAP regression detection independently
- **FR-008**: The baseline workflow MUST tolerate gaze
  analysis failures gracefully — a failed analysis
  MUST NOT break the main branch or block subsequent
  merges

### Key Entities

- **Baseline file**: The reference CRAP scores at
  `.gaze/baseline.json`, regenerated by CI after each
  merge
- **CRAP Load Analysis**: The existing PR check workflow
  that compares PR scores against the baseline
- **Epsilon tolerance**: The minimum CRAP score delta
  required to flag a regression (default 0.5)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero false CRAP regressions caused by
  cross-platform coverage differences across 10
  consecutive PRs
- **SC-002**: The baseline file is automatically updated
  within 5 minutes of each merge to main
- **SC-003**: CRAP score fluctuations below 0.5 do not
  trigger regression warnings
- **SC-004**: The baseline update workflow does not
  create recursive CI runs

## Dependencies

- **CRAP Load Analysis workflow** (`ci_crapload.yml`):
  The existing PR check that will consume the
  CI-generated baseline
- **Reusable workflow** (`complytime/org-infra`): The
  upstream reusable workflow needs an epsilon tolerance
  input. If upstream cannot accept this change, the
  epsilon logic must be implemented locally.
- **Gaze**: The CRAP analysis tool installed on CI
  runners

## Assumptions

- The `ubuntu-latest` CI runner is the canonical
  environment for CRAP analysis. The baseline reflects
  this environment's coverage characteristics.
- The `GITHUB_TOKEN` default permissions with
  `contents: write` are sufficient for the baseline
  workflow to commit and push to main.
- The `[skip ci]` commit message convention is
  respected by all CI workflows to prevent recursive
  triggers.
- The epsilon tolerance of 0.5 is sufficient to absorb
  platform noise without masking genuine quality
  regressions. This value can be tuned based on
  observed noise levels.
- The upstream `complytime/org-infra` reusable workflow
  may or may not accept the epsilon input. If rejected,
  the epsilon logic will be implemented by forking the
  comparison step in `ci_crapload.yml` locally.
<!-- scaffolded by uf vdev -->
