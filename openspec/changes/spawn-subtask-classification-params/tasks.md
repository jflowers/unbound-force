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

## 1. Command template

- [x] 1.1 Rewrite the parallel-execution spawn call in
  .opencode/commands/uf.unleash.md (implement step, item 3c)
  per design D1: replace the prose carrier sentence ("The
  subtask description MUST carry ... The spawn tool has no
  classification parameters, so the description is the
  contract's carrier on this path.") with a fenced
  `replicator_forge_spawn_subtask` call block passing
  `subtask_description`, `task_classification`, `skill` /
  `skill_absent_reason` (per the classification step),
  `files`, and `project_path`, mirroring the
  `uf_delegate_command` call blocks; add the fail-closed
  enforcement sentence naming `SKILL_REFERENCE_REQUIRED`,
  `SKILL_NOT_FOUND`, and the judgment-classification
  rejection; add the `skill_directive` verbatim-forwarding
  instruction. Update the classification step's
  cross-reference ("Swarm-path `[P]` delegations carry the
  same classification through the spawned subtask
  description") to name the spawn tool's
  `task_classification` parameter. Grep-verify the template
  carries no remaining description-carrier wording (the two
  sites are lines ~909 and ~1088 of the current file).
- [x] 1.2 Update the scaffold mirror
  internal/scaffold/assets/opencode/commands/uf.unleash.md
  byte-identically (cp from the canonical file) and run the
  scaffold drift tests green.

## 2. Governance layers

- [x] 2.1 [P] Update DE-008 in
  .opencode/uf/packs/determinism.md: the Swarm-path clause
  changes from carrying the classification and reference "in
  the spawned subtask description" to passing them "as
  spawn-tool parameters"; the contract list widens from
  `uf_delegate_command` to both delegation tools; "The tool
  enforces" becomes "Both tools enforce". Bump the pack
  version 1.3.0 → 1.4.0 (MINOR: normative carrier change per
  design D3); the severity-mapping list is unchanged (DE-008
  stays in the MUST/CRITICAL list).
- [x] 2.2 [P] Update the Deterministic Delegation Discipline
  section of .opencode/agents/divisor-guard.md per design D4:
  the intro widens from "the command delegation tool's
  parameter contract" to the delegation tools' parameter
  contracts (naming the spawn tool's fields); the Swarm-path
  checklist item drops "which has no parameter contract of
  its own" and audits the spawn call's
  `task_classification`, `skill`, and `skill_absent_reason`
  parameters instead of the prompt prose; the
  self-describing constraint is preserved (no DE-008
  citation). Update the scaffold mirror
  internal/scaffold/assets/opencode/agents/divisor-guard.md
  byte-identically.
- [x] 2.3 [P] Update the Swarm-path sentence in
  .opencode/skills/determinism-first/SKILL.md (Delegated Work
  Carries Its Classification section): "Swarm-path spawn
  prompts ... carry the classification and the verified
  reference (or recorded reason) in the subtask description"
  changes to passing the same fields as spawn-tool
  parameters. Also update the skill's Related Enforcement
  section: the `uf_delegate_command` parameter contract entry
  widens to name both delegation tools' contracts (adding the
  forge subtask spawn tool's `task_classification`, `skill`,
  `skill_absent_reason`), satisfying DE-008's plural
  reference. Repo-local file, no mirror.

## 3. Tests and seam verification

- [x] 3.1 Extend the scaffold pin tests in
  internal/scaffold/scaffold_test.go: the "implement parallel
  workers route through the forge worktree tools" pin asserts
  the parallel-execution guidance contains
  `task_classification:` and the skill-field guidance in the
  spawn call block, and that the stale sentence ("The spawn
  tool has no classification parameters") is absent from both
  the canonical .opencode/commands/uf.unleash.md and its
  embedded mirror; a divisor-guard pin asserts the checklist
  names the spawn parameters and no longer contains "has no
  parameter contract of its own" (canonical and mirror).
- [x] 3.2 Add repo-local governance pins (findProjectRoot
  pattern, mirroring TestNoObsoleteToolNames): the determinism
  pack frontmatter reads version 1.4.0 and DE-008's
  Swarm-path clause names spawn-tool parameters; the
  determinism-first skill names the spawn parameters in its
  delegation guidance.
- [x] 3.3 DE-007 seam verification naming the three layers:
  registration surface (the template's spawn call parameter
  names match the deployed `replicator_forge_spawn_subtask`
  registered input schema — `task_classification`, `skill`,
  `skill_absent_reason` — and the mirrored call block is
  byte-identical to the canonical one); documented output
  shape (the envelope codes named in the template match the
  spawn tool's documented contract:
  `SKILL_REFERENCE_REQUIRED`, `SKILL_NOT_FOUND`,
  input-validation rejection of skill fields on
  judgment-classified calls); write→read round-trips (pin
  tests read back the embedded assets and repo-local sources
  the change writes; drift test round-trips canonical →
  mirror). Also grep-verify the live instruction surfaces
  (.opencode/commands/, .opencode/agents/,
  .opencode/uf/packs/, .opencode/skill/, .opencode/skills/,
  internal/scaffold/assets/) carry no remaining
  "no classification parameters" or
  description-as-carrier wording (change archives excluded).

## 4. Verification, documentation, and issue recording

- [ ] 4.1 CI-parity pre-flight: `make check` (lint, test,
  build, coverage-gate, plugin-test); all green before any
  task in this change is marked complete.
- [ ] 4.2 Documentation gate: add the CHANGELOG.md entry per
  the spec's change-record requirement (spawn call
  parameterization, mirror, DE-008 wording + pack 1.4.0,
  Guard checklist, determinism-first skill); assess
  AGENTS.md, README.md, and docs/ dispositions (expected:
  no structural change; record the assessment). Before
  filing, check open issues in this repo and in
  unbound-force/website for existing coverage of this
  change's documentation needs -- known candidates: this
  repo's #791 (parent change's docs-gate issue),
  unbound-force/website#317 (user-facing documentation of
  the delegation classification contract for /uf.unleash),
  and the epic-level blog tracker #742 -- then reassess the
  blog/tutorial content-coverage disposition at filing time
  (expected: blog covered by #742, no new post; tutorial
  no) and file the mandatory
  documentation issues for this user-facing change (it
  modifies the `/uf.unleash` workflow contract and the
  Guard's review capabilities) and record the filed issue
  numbers in the change record section of proposal.md
  before PR merge.
- [ ] 4.3 Constitution-alignment verification: re-check each
  principle against the final diff (proposal's assessments);
  gatekeeping integrity check — the pack version bump is
  additive bookkeeping, DE-008's MUST/CRITICAL
  classification and every existing rule, severity, and
  threshold are unchanged, and no gate is weakened, bypassed,
  or disabled. Record the verification outcome in the change
  record.

<!-- scaffolded by uf vdev -->
