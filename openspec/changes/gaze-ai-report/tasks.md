# Tasks: Gaze AI Report for Main

## 1. Workflow

- [ ] 1.1 Add an `Upload coverage` step to the `build-and-test` job in
  `.github/workflows/ci_local.yml` after `Enforce Scope Coverage Gate`,
  using `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02`
  (v4.6.2) with `name: coverage-out` and `path: coverage.out`.
- [ ] 1.2 Append a `gaze-ai-report` job to `.github/workflows/ci_local.yml`
  after `council-review-action-tests`: `name: Gaze AI Report`,
  `needs: build-and-test`,
  `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`,
  `permissions: contents: read`,
  `uses: unbound-force/gaze/.github/workflows/reusable_gaze_ai_report.yml@c133b1180f26bf0b2ae433d22f6c7adf9fbff992`,
  `with: coverage-artifact: coverage-out, max-crapload: 30,
  max-gaze-crapload: 12, min-contract-coverage: 55`, and
  `secrets: opencode-config: ${{ secrets.OPENCODE_CONFIG_CONTENT }}`.
- [ ] 1.3 Update the ci_local.yml header comment to mention the push-to-main
  gaze AI report.

## 2. Documentation

- [ ] 2.1 Update the `AGENTS.md` CI workflow table row for Local CI to
  include the gaze AI report (push to main).
- [ ] 2.2 Add a CHANGELOG.md entry for the new job.

## 3. Verification

- [ ] 3.1 `openspec validate gaze-ai-report --strict` passes.
- [ ] 3.2 Workflow YAML parses (python yaml) and actionlint passes if
  available.
- [ ] 3.3 Spec artifacts committed and pushed before implementation
  (Spec Commit Gate).
- [ ] 3.4 Implementation committed and pushed on `opsx/gaze-ai-report`.
- [ ] 3.5 Post-merge: first push run to main executes the full handoff
  (report in step summary, or skip notice if the org secret is not scoped
  to this repo).
