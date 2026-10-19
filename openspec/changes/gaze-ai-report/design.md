# Design: Gaze AI Report for Main

## Context

unbound-force/gaze merged PR #300 (merge SHA
c133b1180f26bf0b2ae433d22f6c7adf9fbff992) publishing
`.github/workflows/reusable_gaze_ai_report.yml`. Its contract: caller
uploads a coverprofile artifact; the workflow installs pinned toolchains,
runs `gaze report --ai=opencode`, enforces optional thresholds, and sources
the entire opencode provider config (EnMaaS, GLM 5.3, literal API key) from
the `opencode-config` secret exported as `OPENCODE_CONFIG_CONTENT`. First
post-merge run on gaze main (39239267809) verified the full path: artifact
handoff, installs, literal-key auth, config-driven model, threshold
enforcement, skip-on-missing-secret.

## Goals

- Push-to-main Gaze AI quality report in this repo's Local CI.
- Zero new secrets and zero workflow maintenance beyond the pin.

## Non-Goals

- Changing PR-side CRAP gating (`ci_crapload.yml` / org-infra).
- Changing coverage ratchets or the scope coverage gate.
- Re-encoding provider config in this repo.

## Decisions

### D1: Pin the reusable workflow by immutable commit SHA

**Rationale**: AGENTS.md governance and org precedent (org-infra workflow
pinned at bd3718a...# v0.8.0). Mutable refs are not allowed; the pin is
updated only through documented review. Comment carries the merge SHA; a
later tag can be added as a comment refinement without moving the pin.

### D2: Coverage handoff via same-run artifact

**Rationale**: The `gaze-ai-report` job runs on a separate runner, so
`build-and-test` uploads `coverage.out` as `coverage-out`
(upload-artifact@ea165f8d...# v4.6.2 — same action and SHA pair the gaze
dogfood validated). Same run, same commit: the profile's import paths map to
identical source. Upload runs on every event (PRs included) so PR runs
exercise the wiring cheaply.

### D3: Thresholds 30 / 12 / 55 as a generous backstop

**Rationale**: Measured Oct 18 metrics are CRAPload 24, GazeCRAPload 9,
average contract coverage 60.25%. The PR-side baseline ratchet remains the
primary enforcement; the push-side thresholds only need to catch gross
regressions (e.g. emergency hotfixes pushed directly to main) without
failing the main build on metric noise. Headroom: +25% CRAPload, +33%
GazeCRAPload, -5.25pp contract coverage.

### D4: Push-to-main-only job, secret gating inherited

**Rationale**: PRs already have the org-infra CRAP gate plus this workflow's
own artifact-upload exercise; the AI report is for main. The reusable
workflow's internal `HAS_OPENCODE_CONFIG` gating posts a skip notice and
succeeds when the org secret is missing (e.g. not scoped to this repo),
so a scope misconfiguration cannot break CI. First run after merge reveals
the actual scope.

### D5: Job shape

**Rationale**: `needs: build-and-test`, `permissions: contents: read`,
`if: github.event_name == 'push' && github.ref == 'refs/heads/main'`,
`uses: unbound-force/gaze/.github/workflows/reusable_gaze_ai_report.yml@c133b1180f26bf0b2ae433d22f6c7adf9fbff992`,
`with: coverage-artifact, max-crapload, max-gaze-crapload, min-contract-coverage`,
`secrets: opencode-config: ${{ secrets.OPENCODE_CONFIG_CONTENT }}`.

## Risks / Trade-offs

- Org secret scope to this repo is unverified (API requires admin:org).
  Mitigation: skip-notice behavior; verify on first push run.
- Thresholds are static while metrics drift. Mitigation: documented in this
  spec; changing them is a spec-visible edit.
- Pin inherits upstream workflow changes only through deliberate re-pinning.
