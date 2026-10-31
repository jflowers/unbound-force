## 1. Scaffold ownership reclassification

- [x] 1.1 In `internal/scaffold/scaffold.go`, flip the
  `isToolOwned` branch for `uf/reviewer-capabilities.yaml`
  (currently lines 672-674) from `return true` to
  `return false`. Replace the branch with an explicit
  extension-point comment mirroring the `uf/review-matrix.yaml`
  branch (lines 675-679): the capabilities manifest is a
  project-owned extension point so generated repositories can
  register custom Divisor agents without a plain `uf init`
  re-run reverting their `reviewers:` entries. Keep the branch
  explicit (do not rely on the default fallthrough) so the
  classification is documented at the point of decision.
- [x] 1.2 In `internal/scaffold/scaffold_test.go`, update the
  `isToolOwned` ownership table entry (currently line 2800)
  from `{"uf/reviewer-capabilities.yaml", true}` to
  `{"uf/reviewer-capabilities.yaml", false}`, and update the
  adjacent comment from "Tool-owned: canonical review policy"
  to user-owned extension-point wording that names the pairing
  with `uf/review-matrix.yaml`. Leave the
  `uf/schemas/reviewer-capabilities/*` entries tool-owned.
- [x] 1.3 In `internal/scaffold/scaffold_test.go`, add
  `TestRun_ReviewerCapabilitiesPreservedOnRerun` modeled on
  `TestRun_ConstitutionPreservedOnRerun` (line 2312):
  run the scaffold into `t.TempDir()`, append a local
  `reviewers:` entry for a `divisor-custom-example` agent to
  the deployed `.uf/reviewer-capabilities.yaml`, re-run
  without `--force`, then assert the file appears in
  `result.Skipped` (not `Created`, `Updated`, or
  `Overwritten`) and its on-disk content is byte-identical to
  the pre-run content. Do not add a force-overwrite variant:
  `TestRun_ForceOverwrites` already covers `--force` for every
  non-never-overwrite asset.

## 2. Documentation and change record

- [x] 2.1 [P] Update `docs/architecture.md` File Ownership
  Model section: state that `.uf/reviewer-capabilities.yaml`
  joins `.uf/review-matrix.yaml` as a project-owned extension
  point — seeded once on first deploy, skipped on plain
  re-runs, reset only by `--force` (destructive).
- [x] 2.2 [P] Update `docs/configuration.md` Review Council
  Configuration table: document the seeding and survival
  semantics for `.uf/reviewer-capabilities.yaml` (local
  `reviewers:` entries survive plain `uf init` re-runs;
  `--force` resets to canonical).
- [x] 2.3 [P] Add a `CHANGELOG.md` entry under
  Unreleased → Changed describing the reclassification and
  its user-visible effect (custom agent registrations survive
  re-init; canonical list updates no longer auto-flow).
- [x] 2.4 [P] File the documentation issues required by the
  documentation gates: one issue against the current repo for
  this user-facing `uf init` behavior change, and one
  cross-repo issue against `unbound-force/website` per the
  constitution's Cross-Repo Documentation rule. Record both
  issue numbers in the PR description.

## 3. Validation and verification

- [x] 3.1 Run `go test -race -count=1 ./internal/scaffold/...`
  and verify green, explicitly confirming: the flipped
  ownership table, the new regression test, the
  drift-detection pairs (embedded ↔ deployed `.uf/` copies
  remain byte-identical), and the DivisorOnly deployment
  table (both review-config files still deploy).
- [ ] 3.2 Run `make check` for CI parity (lint, test, build,
  coverage gate, plugin tests) and confirm green.
- [ ] 3.3 Verify constitution alignment per the proposal:
  Principle II (projects extend via config, not tool
  patching), Principle IV (regression test verifies
  observable dispositions with no external services),
  Principle V (eligibility stays fail-closed; schema
  validation and matrix limits untouched), Principle VI (no
  mechanical prose added to commands, agents, or skills).
  Confirm the Gatekeeping rule holds: no quality or
  governance gate was modified by this change.
