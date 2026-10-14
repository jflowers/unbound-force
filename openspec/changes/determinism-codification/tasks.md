<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file --
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Author repo-local governance artifacts

All tasks in this group touch different files and have no
ordering constraints.

- [x] 1.1 [P] Amend `.specify/memory/constitution.md`: insert
  Principle VI "Deterministic Execution" after Principle V
  (before `## Hero Constitution Alignment`) in the established
  format (intro + bold-lead bullets + Rationale); update the
  SYNC IMPACT REPORT comment (Version 1.3.1 -> 1.4.0, new
  principle, hero alignment due within one release cycle); bump
  the footer to Version 1.4.0, Last Amended 2026-10-14. No
  scaffold asset changes (`specify/` is excluded from drift
  tests).
- [x] 1.2 [P] Create `.opencode/uf/packs/determinism.md` with
  DE-001 [MUST], DE-002 [SHOULD], DE-003 [MUST], DE-004 [SHOULD]
  per the spec scenarios; follow the governance-pack format
  precedent (see `content.md`, `ci.md`) — domain-specific
  sections and RFC 2119 rules, not the coding-pack H2 schema.
- [x] 1.3 [P] Create `.opencode/skills/determinism-first/SKILL.md`
  with YAML frontmatter (name/description/tags) and the
  classify-before-writing guidance body per the spec.
- [x] 1.4 [P] Update `AGENTS.md`: add the "Determinism gate"
  Behavioral Rule (CRITICAL severity, style-matched to existing
  rules) and make the Convention Packs listing exhaustive
  (add `determinism.md`, `ci.md`, `ci-custom.md`).
- [x] 1.5 [P] Add the CHANGELOG.md entry for this change
  (repo-local codification, constitution 1.4.0, pack, skill,
  AGENTS.md rule).
- [x] 1.6 [P] Update `internal/scaffold/scaffold_test.go`
  `knownNonEmbeddedFiles`: add entries for
  `opencode/uf/packs/determinism.md` and
  `opencode/skills/determinism-first/SKILL.md` following the
  existing map style. No scaffold asset is created.
- [x] 1.7 [P] Update `internal/schemas/packvalidator_test.go`:
  add `determinism.md` to the skip list in
  `TestValidateConventionPack_AllPacksValid` with a rationale
  comment (governance pack, not a coding convention pack),
  following the `severity.md`/`content.md`/`ci.md` precedent.

## 2. Verification

Sequential; every gate must pass before the change is marked
complete.

- [x] 2.1 Run `make lint` and `make test` (CI parity: lint covers
  the new markdown governance files and the scaffold_test.go edit;
  drift tests pick up the new pack and skill via the exclusion
  map; the pack-validation gate skips the governance pack via the
  task 1.7 skip-list entry; embedded-asset checks unchanged).
- [x] 2.2 Run `make plugin-test` (review-dispatch prompt assembly
  auto-discovers the new pack; update golden fixtures if pack-set
  assertions fail).
- [x] 2.3 Verify the determinism-first skill's YAML frontmatter
  parses and the skill is discoverable with its description in an
  opencode session (spec scenario: Skill discoverable in sessions).
- [x] 2.4 Verify constitution alignment against Principles I-V
  (Autonomous Collaboration, Composability First, Observable
  Quality, Testability, Security by Default) per the proposal's
  alignment section; confirm the amendment added a principle
  without altering or removing I-V.
- [x] 2.5 Run `openspec validate determinism-codification --type
  change --strict` and confirm the change validates cleanly.
