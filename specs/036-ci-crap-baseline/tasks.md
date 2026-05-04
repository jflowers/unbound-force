## 1. CI Baseline Update Workflow

- [x] 1.1 Create `.github/workflows/ci_baseline_update.yml`
  with: SPDX header, `on: push` to main trigger,
  `contents: write` permission, concurrency group
  `baseline-update`, `cancel-in-progress: true`
- [x] 1.2 Add steps: checkout (with `persist-credentials:
  true`), setup Go (from `go.mod`), install gaze
  (same version as ci_crapload reusable workflow)
- [x] 1.3 Add step: run `gaze crap --format=json ./... >
  .gaze/baseline.json` (with stderr redirect to avoid
  warnings in JSON)
- [x] 1.4 Add step: check diff with
  `git diff --quiet .gaze/baseline.json` — if no
  changes, skip commit
- [x] 1.5 Add step: configure git user
  (`github-actions[bot]`), commit with message
  `chore: update CRAP baseline [skip ci]`, push to main
- [x] 1.6 Add `if: github.actor != 'github-actions[bot]'`
  condition on the job to prevent the baseline commit
  from triggering itself

## 2. Epsilon Tolerance in CRAP Load Check

- [x] 2.1 Modify `ci_crapload.yml`: add
  `continue-on-error: true` to the `crapload` job so
  its pass/fail does not determine the overall check
- [x] 2.2 Add new `evaluate` job after `crapload` that
  downloads the `crapload-analysis` artifact
- [x] 2.3 In the `evaluate` job: parse the analysis
  artifact's JSON scores, compare against baseline
  with epsilon 0.5 for both CRAP and GazeCRAP
- [x] 2.4 The `evaluate` job MUST fail (exit 1) only
  when regressions exceed epsilon — deltas at or below
  0.5 are treated as noise
- [x] 2.5 The `evaluate` job MUST output a summary
  indicating how many regressions were filtered by
  epsilon vs how many remain
- [x] 2.6 Update the `post-comment` job to depend on
  `evaluate` instead of (or in addition to) `crapload`

## 3. Upstream Epsilon PR

- [x] 3.1 File a GitHub issue in `complytime/org-infra`
  proposing a `regression-epsilon` input (default 0.5)
  for `reusable_crapload_analysis.yml`

## 4. Documentation

- [x] 4.1 [P] Update AGENTS.md CI Workflow Structure
  table: add `ci_baseline_update.yml` row
- [x] 4.2 [P] Update AGENTS.md "Recent Changes" with
  this change summary

## 5. Verification

- [x] 5.1 Run `go build ./...` — verify clean build
  (no Go changes, confirms no regressions)
- [x] 5.2 Validate YAML syntax of both workflow files:
  `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci_baseline_update.yml'))"`
  and same for `ci_crapload.yml`
<!-- scaffolded by uf vdev -->
<!-- spec-review: passed -->
<!-- code-review: passed -->
