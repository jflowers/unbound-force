# CI Local Requirements

## ADDED Requirements

### Requirement: Local CI MUST upload the coverage profile

The `build-and-test` job in `.github/workflows/ci_local.yml` MUST upload
`coverage.out` as an artifact named `coverage-out` on every run, using
`actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02` (v4.6.2),
so downstream jobs can consume the same-run, same-commit profile.

#### Scenario: Coverage artifact available after build-and-test

- **GIVEN** Local CI runs on a push or pull request
- **WHEN** the `build-and-test` job completes
- **THEN** a `coverage-out` artifact containing `coverage.out` exists for
  that run

### Requirement: Local CI MUST run a Gaze AI report on pushes to main

A `gaze-ai-report` job MUST run only on pushes to `refs/heads/main`, MUST
need `build-and-test`, MUST consume
`unbound-force/gaze/.github/workflows/reusable_gaze_ai_report.yml` pinned at
commit SHA `c133b1180f26bf0b2ae433d22f6c7adf9fbff992`, MUST pass the
`coverage-out` artifact, and MUST pass the `opencode-config` secret sourced
from `secrets.OPENCODE_CONFIG_CONTENT`.

#### Scenario: Push to main with the org secret in scope

- **GIVEN** the org secret `OPENCODE_CONFIG_CONTENT` resolves in this repo
- **WHEN** a push to main completes `build-and-test`
- **THEN** the reusable workflow generates the EnMaaS Gaze quality report
  in the step summary

#### Scenario: Push to main without the org secret

- **GIVEN** the org secret is not scoped to this repo
- **WHEN** the `gaze-ai-report` job runs
- **THEN** it posts a skip notice and succeeds

### Requirement: The AI report MUST enforce thresholds 30 / 12 / 55

The `gaze-ai-report` job MUST pass `max-crapload: 30`,
`max-gaze-crapload: 12`, and `min-contract-coverage: 55` to the reusable
workflow, and the job MUST fail when the report breaches them. Threshold
changes MUST update this spec.

#### Scenario: Threshold breach fails the job

- **GIVEN** a push to main produces metrics beyond the thresholds
- **WHEN** the reusable workflow runs the report
- **THEN** the `gaze-ai-report` job fails

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
