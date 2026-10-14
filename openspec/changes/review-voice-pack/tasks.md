<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the same group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Convention Pack Assets

- [x] 1.1 Create `.opencode/uf/packs/review-voice.md` with
  frontmatter (`pack_id: review-voice`, `language: Any`,
  `version: 1.0.0`), scaffold marker, and RV-NNN rules in three
  sections: Applicability (FR-032), Style-Only Precedence
  (FR-031), Neutral Voice Defaults (FR-030)
- [x] 1.2 Create `.opencode/uf/packs/review-voice-custom.md`
  custom stub with CR-NNN prefix, sentinel comment, and
  `# Custom Rules: Review Voice` heading (FR-033)
- [x] 1.3 Mirror `review-voice.md` byte-identically into
  `internal/scaffold/assets/opencode/uf/packs/` (FR-020); seed
  the embedded `review-voice-custom.md` as the initial
  deployment template — it is not drift-compared (FR-021,
  FR-023)

## 2. Scaffold Engine Registration

- [x] 2.1 In `internal/scaffold/scaffold.go`, add
  `review-voice` and `review-voice-custom` to
  `alwaysDeployedPacks` (FR-004)
- [x] 2.2 In `internal/scaffold/scaffold.go`, add
  `review-voice.md` and `review-voice-custom.md` to the
  `collectDeployedPacks` candidates list (FR-003)

## 3. Scaffold and Validator Tests

- [x] 3.1 In `internal/scaffold/scaffold_test.go`, add both
  pack paths to `expectedAssetPaths` and update the
  convention-pack count comment from 13 to 15 (FR-022)
- [x] 3.2 Update `TestCollectDeployedPacks_*` expectations in
  `internal/scaffold/scaffold_test.go` for the two new
  always-deployed packs (7 → 9 for default lang; update
  go/typescript variants)
- [x] 3.3 Add `review-voice.md` to the skip list in
  `TestValidateConventionPack_AllPacksValid`
  (`internal/schemas/packvalidator_test.go`) with the
  non-coding pack justification comment (FR-012)
- [x] 3.4 In `internal/scaffold/scaffold_test.go`, add a
  `TestEmbeddedAssets_MatchSource` skip for
  `opencode/uf/packs/*-custom.md` assets with a justification
  comment (custom packs are user-owned; embedded copies are
  initial deployment templates) (FR-023)

## 4. Command Integration — GitHub-Posted Prose

- [x] 4.1 [P] In `.opencode/commands/uf.review-pr.md` Step 8b
  (~line 710): add a load of `review-voice.md` +
  `review-voice-custom.md` before inline comment composition
  and an apply directive covering 8b inline comment text and
  8d review body prose, citing the style-only precedence
  clause; no changes to Step 6 or Step 3.9 (FR-040, FR-041).
  Mirror the edited file byte-identically into
  `internal/scaffold/assets/opencode/commands/`
- [x] 4.2 [P] In `.opencode/commands/uf.review-council.md`
  Step 7d (~line 742): add the same load + apply directive
  covering 7d review body, 7e inline comments, and 7g posted
  review; no changes to Step 6 or Spec Review Mode (FR-050,
  FR-051). Mirror the edited file byte-identically into
  `internal/scaffold/assets/opencode/commands/`
- [x] 4.3 [P] In `.opencode/commands/uf.triage-issue.md` Phase
  4.3 (~line 511): add the pack load before comment
  composition and a style-layer apply directive that
  explicitly subordinates voice to the tone-tier content
  requirements; no changes to Phase 4.1 or Phase 1.3 (FR-060,
  FR-061). Mirror the edited file byte-identically into
  `internal/scaffold/assets/opencode/commands/`
- [x] 4.4 [P] In `.opencode/commands/uf.address-feedback.md`
  Phase 4.5 (~line 751): add an apply directive for reply
  comment prose noting the packs are already loaded by the
  Phase 2.1 glob and that required reply elements (commit SHA
  reference, REJECT evidence) remain binding (FR-070,
  FR-071). Mirror the edited file byte-identically into
  `internal/scaffold/assets/opencode/commands/`

## 5. Validation

- [x] 5.1 Run `make test` (go test -race -count=1 ./...) —
  drift tests verify embedded tool-owned assets match
  canonical sources (custom packs exempt per FR-023);
  collectDeployedPacks and validator tests cover the new pack
  (FR-020–FR-023, FR-012)
- [x] 5.2 Run `make plugin-test` — existing
  build-review-prompts tests confirm pack embedding behavior
  is unchanged (FR-080)
- [x] 5.3 Run `make lint` and `make coverage-gate`
- [x] 5.4 Verify constitution alignment: confirm no gate
  values changed (severity definitions, verdict mappings,
  review limits, footers, top-15, suggestion format, size
  limits) — style-only precedence per proposal Constitution
  Alignment and design D6

## 6. Documentation

- [x] 6.1 Add a CHANGELOG.md entry for the review-voice pack
  pair with the trailer `(Spec:
  openspec/changes/review-voice-pack/, Fixes: #657)`
- [x] 6.2 Add `review-voice` and `review-voice-custom` to the
  Convention Packs list in AGENTS.md (repo root) —
  review-voice pair only; do not fix the pre-existing
  ci/ci-custom omission
- [x] 6.3 File a documentation issue for this user-facing
  change in `unbound-force/website` before PR merge, per
  the org constitution's Cross-Repo Documentation rule
  (`.specify/memory/constitution.md:253-259`). Two
  documentation gates apply (constitution: website repo;
  repo AGENTS.md: current repo); the constitution target
  is selected as the sole documentation issue for this
  change — human-authorized during the review-voice-pack
  spec review and recorded here so the reconciliation
  travels with the change. Name the #657 content
  opportunity as a blog/tutorial candidate in the issue
  body (org docs+blog triplet pattern). File a separate
  issue for the pre-existing ci/ci-custom pack-listing
  gap covering AGENTS.md, docs/usage.md (~lines
  200-211), and docs/architecture.md (~lines 682-693)
- [x] 6.4 Update scaffold-inventory counts to actual values in
  README.md (~line 64, "50 files"), QUICKSTART.md (~lines
  155/161, "34+ files" / "9 convention packs"), docs/usage.md
  (~lines 200-211), and docs/architecture.md (~lines
  674-694) — recount at implementation time; the pack
  directory will contain 15 files including the review-voice
  pair
- [x] 6.5 Update the AGENTS.md Testing Conventions
  drift-detection line to match FR-023 and design D7:
  tests verify embedded tool-owned assets match canonical
  sources; custom packs (`*-custom.md`) are exempt as
  user-owned initial deployment templates
