# Gaze AI Report for Main

## Why

Pull requests get CRAP enforcement via the org-infra `ci_crapload.yml` gate,
but pushes to main produce no AI quality narrative. The unbound-force/gaze
repo now publishes a provider-agnostic reusable workflow
(`reusable_gaze_ai_report.yml`, merged as c133b1180f26bf0b2ae433d22f6c7adf9fbff992)
that generates an EnMaaS/GLM 5.3 Gaze quality report from a coverage
artifact, gated on the org secret `OPENCODE_CONFIG_CONTENT`. The secret and
workflow were verified end-to-end on the gaze repo's first post-merge run
(39239267809). This repo should consume that workflow to gain a push-to-main
quality report with threshold backstops at zero maintenance cost.

## What Changes

1. `.github/workflows/ci_local.yml`: the `build-and-test` job uploads
   `coverage.out` as the `coverage-out` artifact on every run.
2. `.github/workflows/ci_local.yml`: a new `gaze-ai-report` job runs only on
   pushes to main, consumes the SHA-pinned reusable workflow with thresholds
   `max-crapload: 30`, `max-gaze-crapload: 12`, `min-contract-coverage: 55`,
   and passes the `opencode-config` secret from `OPENCODE_CONFIG_CONTENT`.
3. `AGENTS.md` CI workflow table and `CHANGELOG.md` document the new job.

## Capabilities

### Modified

- `ci-local`: Local CI gains a coverage artifact upload and a push-to-main
  Gaze AI report job.

## Impact

- `.github/workflows/ci_local.yml` — upload step + new job
- `AGENTS.md` — CI workflow table row
- `CHANGELOG.md` — change entry
- No Go, plugin, or gate changes; existing coverage ratchets, scope coverage
  gate, and PR-side CRAP gate are untouched.

## Constitution Alignment

### I. Accuracy

**Assessment**: PASS — thresholds derive from measured Oct 18 metrics
(CRAPload 24, GazeCRAPload 9, contract coverage 60.25%) with documented
headroom; the reusable workflow is verified in production on gaze main.

### II. Minimal Assumptions

**Assessment**: PASS — no new secrets are created; the existing org secret
`OPENCODE_CONFIG_CONTENT` is reused. If it is not scoped to this repo, the
job posts a skip notice and succeeds rather than failing.

### III. Actionable Output

**Assessment**: PASS — the report lands in the run's step summary with
prioritized recommendations, same as the verified gaze runs.

### IV. Testability

**Assessment**: PASS — PR runs exercise the upload step; the first push run
after merge verifies the full handoff (gaze run 39239267809 is the
production precedent for the reusable workflow itself).
