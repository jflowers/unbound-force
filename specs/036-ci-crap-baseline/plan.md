---
title: CI-Generated CRAP Baseline — Implementation Plan
status: draft
created: 2026-05-03
spec: "036"
---

# Implementation Plan: CI-Generated CRAP Baseline

## Scope

Two CI workflow changes + AGENTS.md documentation:

1. **New workflow**: `ci_baseline_update.yml` — runs
   after push to main, regenerates `.gaze/baseline.json`
   using CI runner, commits if changed
2. **Modified workflow**: `ci_crapload.yml` — add
   epsilon tolerance to the comparison step (local
   override since the reusable workflow lacks this
   input)
3. **AGENTS.md**: Document the CI baseline strategy

## Approach

### Part 1: CI Baseline Auto-Update

A new workflow triggered on `push` to `main` that:
1. Checks out code
2. Installs Go + gaze (same versions as ci_crapload)
3. Runs `gaze crap --format=json ./...` to generate
   the baseline
4. Compares against existing `.gaze/baseline.json`
5. If different: commits with `[skip ci]` message and
   pushes to main

The workflow uses `contents: write` permission and a
concurrency group to prevent simultaneous updates.

### Part 2: Epsilon Tolerance

Since the upstream reusable workflow
(`complytime/org-infra`) does not support an epsilon
input, we add a local post-processing step to
`ci_crapload.yml` that re-evaluates the reusable
workflow's regression output with epsilon tolerance.

Approach: the reusable workflow's `crapload` job will
still run its comparison. We add a new `evaluate` job
that downloads the analysis artifact, re-parses the
regressions, filters out deltas below epsilon (0.5),
and fails only if real regressions remain. The original
`crapload` job's pass/fail is ignored via
`continue-on-error: true`.

Simultaneously, file an upstream PR to
`complytime/org-infra` proposing a
`regression-epsilon` input.

## Files

| File | Change |
|------|--------|
| `.github/workflows/ci_baseline_update.yml` | NEW |
| `.github/workflows/ci_crapload.yml` | Add epsilon evaluation job |
| `AGENTS.md` | Document baseline strategy |

## Risks

- **Direct commit to main**: The baseline update
  commits directly to main. Mitigated by `[skip ci]`
  tag, only touching `.gaze/baseline.json`, and
  concurrency group.
- **Recursive trigger**: The baseline commit could
  trigger other CI workflows. Mitigated by `[skip ci]`
  in the commit message.
- **Upstream reusable workflow changes**: If
  `complytime/org-infra` adds epsilon support, we can
  simplify the local override. No harm in keeping both.
<!-- scaffolded by uf vdev -->
