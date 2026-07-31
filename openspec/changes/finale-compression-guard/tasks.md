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

  All tasks in Group 1 modify the same file
  (.opencode/commands/uf.finale.md) so NONE are
  parallel-eligible. Group 2 copies the result to the
  scaffold asset (different file, but depends on Group 1).
-->

## 1. Add compression guards to uf.finale.md

All tasks modify `.opencode/commands/uf.finale.md`.
Apply edits sequentially top-to-bottom to avoid
line-shift conflicts.

- [x] 1.1 Add session-resume guard between `## Instructions`
  heading (line 34) and `### 1. Branch Safety Gate`
  (line 36). Use the same blockquote pattern from
  `uf.review-pr.md` (lines 846-855), adapted for
  `/uf.finale` context. The guard MUST instruct the
  agent to re-read the template on resume and re-confirm
  gates via AskUserQuestion.

- [x] 1.2 Add execution checklist immediately after the
  session-resume guard. Include checkboxes for Steps 1-8
  and state variables: `BRANCH=<set when known>`,
  `COMMIT=<set when known>`, `PR_NUMBER=<set when known>`,
  `PR_URL=<set when known>`,
  `CONFLICT_OPTION=<set when known>`. Include instruction
  that the agent MUST update the checklist using the Edit
  tool after each step.

- [x] 1.3 Wrap Step 2 secrets check gate (lines 70-81)
  with `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED
  <<<` and `>>> END MANDATORY GATE <<<` markers.

- [x] 1.4 Add checkpoint reminder at end of Step 2
  (before Step 3 heading): "**Checkpoint**: Update the
  execution checklist (mark Step 2 `[x]`) before
  proceeding."

- [x] 1.5 Add checkpoint reminder at end of Step 3
  (before Step 4 heading): "**Checkpoint**: Update the
  execution checklist -- set `COMMIT=<hash>` and mark
  Step 3 `[x]` before proceeding."

- [x] 1.6 Add checkpoint reminder at end of Step 4
  (before Step 5 heading): "**Checkpoint**: Update the
  execution checklist (mark Step 4 `[x]`) before
  proceeding."

- [x] 1.7 Wrap Step 5f PR body approval (lines 318-332)
  with mandatory gate markers. Ensure the approval uses
  AskUserQuestion tool (currently prose-based). Add
  checkpoint reminder after Step 5g to set
  `PR_NUMBER=<number>` and `PR_URL=<url>`.

- [x] 1.8 Add session-resume guard specific to Step 5f:
  if the agent cannot verify PR body approval in
  uncompressed history, it MUST re-present and re-confirm.

- [x] 1.9 Wrap Step 6b conflict recovery option selection
  (lines 444-459) with mandatory gate markers. Add
  instruction to set `CONFLICT_OPTION=<N>` in the
  checklist after user selects an option.

- [x] 1.10 Wrap Step 6 CI failure options (lines 373-386)
  with mandatory gate markers.

- [x] 1.11 Add checkpoint reminders at end of Steps 6,
  6b, 7, and 8 to mark their respective checklist items.

## 2. Sync scaffold copy

- [x] 2.1 Copy the updated `.opencode/commands/uf.finale.md`
  to `internal/scaffold/assets/opencode/commands/uf.finale.md`
  so both files are identical.

## 3. Verification

- [x] 3.1 Run `make test` to verify drift detection tests
  pass (scaffold copy matches command file).

- [x] 3.2 Verify constitution alignment: confirm the change
  aligns with Principle III (Observable Quality -- checklist
  produces observable state) and Principle V (Security by
  Default -- gates protected against compression bypass).
  No new dependencies introduced (Principle II).

<!-- spec-review: passed -->
<!-- code-review: passed -->
