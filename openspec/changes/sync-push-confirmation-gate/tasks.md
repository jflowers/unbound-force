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

## 1. Update sync-push command with confirmation gate

- [x] 1.1 Rewrite `.opencode/commands/muti-mind.sync-push.md`
  instructions to add the three-step flow per FR-003 and
  design decisions D1-D4: (1) invoke `sync-status` to
  preview sync state (FR-001, D2), (2) present
  `AskUserQuestion` with "Yes -- sync to GitHub" and
  "No -- abort" options (FR-002, D3), (3) invoke
  `sync-push` backend only if confirmed, otherwise
  display abort message. Include error handling for
  sync-status failures and empty sync state.

## 2. Verification

Note: No automated test changes are required. This change
modifies only the slash command instruction file
(`.opencode/commands/muti-mind.sync-push.md`), which is a
markdown file containing agent instructions. The Go backend
is unchanged and its existing test coverage is unaffected.
Verification is manual (tasks 2.1, 2.2).

- [x] 2.1 Verify the updated command file has no code path
  that bypasses the confirmation gate (FR-001, FR-002,
  FR-003 no-bypass scenario). Read the final file and
  confirm that (a) `sync-push` appears in the Instructions
  section only after the AskUserQuestion step, (b) there
  is no conditional branch that skips the confirmation,
  and (c) the abort path does not invoke the backend.
- [x] 2.2 [P] Verify constitution alignment: confirm the
  change does not introduce runtime coupling between
  heroes (Principle I), does not add mandatory
  dependencies (Principle II), and maintains security
  posture with the human confirmation gate (Principle V).
<!-- spec-review: passed -->
<!-- code-review: passed -->
