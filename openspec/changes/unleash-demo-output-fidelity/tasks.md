<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Template fixes (uf.unleash.md)

All tasks in this group modify the same file:
`.opencode/commands/uf.unleash.md`

- [x] 1.1 Add JIT re-read instruction at the top of
  Step 10 Demo (before "1. What Was Built"). The
  instruction MUST tell the agent to re-read the
  Step 10 Demo section of this template file (by
  section heading, not line numbers) before composing
  any demo output. Use a blockquote format consistent
  with the existing Session-Resume Guard and CHECKPOINT
  blockquotes. (FR-001, D1)

- [x] 1.2 Reconcile the two divergent "Next Steps"
  blocks. Update the prose description to reference the
  format block as canonical rather than paraphrasing it
  independently. The prose SHOULD say something like
  "always present these two options exactly as shown in
  the format block below." (D2, MODIFIED: Next Steps
  divergence reconciliation)

- [x] 1.3 Add Step 8 equivalence note in the Next Steps
  prose section. The note MUST state that the pre-PR
  `/uf.review-council` requirement is already satisfied
  by Step 8 and MUST NOT be re-suggested in the demo
  output. (FR-002, D3)

- [x] 1.4 Add anti-improvisation guardrail to the
  Guardrails section. Add: "NEVER improvise Demo exit
  text — the 'Next Steps' section in Step 10 prescribes
  the exact output; re-read and reproduce it verbatim."
  (FR-003, D4)

## 2. Scaffold sync (uf.unleash.md)

- [x] 2.1 Copy the updated canonical
  `.opencode/commands/uf.unleash.md` to
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`
  verbatim. The drift test `TestEmbeddedAssets` enforces
  parity. (D2 scaffold pattern)

## 3. always-on-guidance updates

- [x] 3.1 Add "Command Template Fidelity" section to
  `.opencode/skills/always-on-guidance/SKILL.md` with
  two rules: (1) re-read prescribed output sections from
  command templates before emitting, especially after
  compression; (2) after compression, the template file
  is the sole authority for prescribed output format.
  (FR-004, D5)

- [x] 3.2 Copy the updated canonical
  `.opencode/skills/always-on-guidance/SKILL.md` to
  `internal/scaffold/assets/opencode/skills/always-on-guidance/SKILL.md`.
  Create the directory if it does not exist. (FR-005, D6)

- [x] 3.3 Update `internal/scaffold/scaffold_test.go`:
  add `"opencode/skills/always-on-guidance/SKILL.md"` to
  `expectedAssetPaths` and remove
  `".opencode/skills/always-on-guidance/SKILL.md": true`
  from `knownNonEmbeddedFiles`. (FR-005, D6)

- [x] 3.4 Add `.opencode/skills` to the `canonicalDirs`
  slice in `TestCanonicalSources_AreEmbedded`
  (`scaffold_test.go`). This closes the reverse-drift
  gap for all scaffolded skills. (FR-006, D8)

## 4. AGENTS.md clarification

- [x] 4.1 [P] Amend the review-council rule (search for
  "MUST run `/uf.review-council` before PR submission"):
  change to "MUST run `/uf.review-council` before PR
  submission (already executed as `/uf.unleash` Step 8;
  do not re-run)." (D7, MODIFIED requirement)

- [x] 4.2 [P] Update the PR Review Commands table
  (search for `/uf.review-council` row): change the
  "When" column from "Pre-PR (local)" to "Pre-PR
  (local; runs in `/uf.unleash` Step 8)". (D7)

## 5. Verification

- [x] 5.1 Run `go test -race -count=1 ./internal/scaffold/...`
  to verify drift tests pass (canonical == embedded for
  both `uf.unleash.md` and `always-on-guidance/SKILL.md`,
  `knownNonEmbeddedFiles` exclusion removed).

- [x] 5.2 Run `make check` to verify full CI parity
  (lint + test + build).

- [x] 5.3 [P] Grep verification: confirm
  `/uf.review-council` does NOT appear in Step 10 Next
  Steps output block of `uf.unleash.md`. Confirm only
  `/uf.finale` and `/speckit.clarify` appear. Also
  verify: (a) "NEVER improvise Demo exit text" in
  Guardrails section, (b) "Command Template Fidelity"
  in `always-on-guidance/SKILL.md`, (c) "already
  executed" or "Step 8" equivalence note in Step 10.

## 6. Documentation

- [x] 6.1 [P] Update CHANGELOG.md: add entry under
  Unreleased/Changed describing the template fidelity
  improvements.
<!-- spec-review: passed -->
<!-- code-review: passed -->
<!-- scaffolded by uf vdev -->
