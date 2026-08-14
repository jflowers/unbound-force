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

## 1. Add mandatory gate block to uf.triage-issue.md

- [x] 1.1 Insert `>>> MANDATORY GATE: HUMAN CONFIRMATION
  REQUIRED <<<` marker block immediately after the Phase 4
  heading (`## Phase 4: Act (Interactive)`, currently line 211) in
  `.opencode/commands/uf.triage-issue.md`. The gate block
  MUST include:
  (a) the mandatory gate marker,
  (b) a session-resume guard identical in structure to
  `uf.review-council.md` Step 7f (lines 662-673),
  (c) instruction to display the Phase 4.1 summary before
  presenting the confirmation question,
  (d) a `question tool` call with options
  `["Proceed -- execute triage actions", "Skip -- write
  artifact only"]`,
  (e) stop instruction if user selects "Skip",
  (f) reiteration of the `gh api --input <tmpfile>`
  requirement for all GitHub mutations in Phase 4

## 2. Sync scaffold canonical

- [x] 2.1 Copy the updated content from
  `.opencode/commands/uf.triage-issue.md` to
  `internal/scaffold/assets/opencode/commands/uf.triage-issue.md`
  so both files are identical

## 3. Verification

- [x] 3.1 Run `make test` to verify the drift-detection
  test passes (confirms the two files are in sync)
- [x] 3.2 Verify constitution alignment: the change
  strengthens Principle V (Security by Default) by
  enforcing the `--input` pattern at the mutation boundary,
  and does not violate Principles I-IV (per proposal.md
  assessment)

<!-- spec-review: passed -->
<!-- code-review: passed -->
