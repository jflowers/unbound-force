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

## 1. Add TodoWrite instructions to pipeline commands

Each task adds a TodoWrite instruction block to one
command file. The block is placed after the session-resume
guard and execution checklist, before the first step.
All four tasks touch different files and are
parallel-eligible. After modifying each canonical command
file, also copy it to the corresponding scaffold asset
at `internal/scaffold/assets/opencode/commands/<filename>`
to maintain byte-identity (enforced by
`TestEmbeddedAssets_MatchSource`).

- [x] 1.1 [P] Add TodoWrite instruction block to
  `.opencode/commands/uf.unleash.md`. Insert after the
  execution checklist (after line 62) and before
  "### 0. Startup Cleanup". The block MUST instruct the
  agent to: (1) initialize TodoWrite with all 11 steps
  (Steps 0-10) as `pending` at pipeline start, (2) mark
  each step `in_progress` before starting and `completed`
  after finishing, (3) on resume from compressed context,
  re-initialize TodoWrite from the execution checklist
  state. Reference FR-001, FR-002, FR-003, FR-004 from
  `specs/todowrite-visibility.md`.

- [x] 1.2 [P] Add TodoWrite instruction block to
  `.opencode/commands/uf.finale.md`. Insert after the
  Edit tool usage instructions (after line 80) and before
  "### 1. Branch Safety Gate". The block MUST instruct
  the agent to: (1) initialize TodoWrite with all 8
  steps (Steps 1-8) as `pending` at pipeline start,
  (2) mark each step `in_progress` before starting and
  `completed` after finishing, (3) on resume, re-initialize
  from checklist state. Reference FR-001, FR-002, FR-003,
  FR-004.

- [x] 1.3 [P] Add TodoWrite instruction block to
  `.opencode/commands/uf.review-council.md`. Insert after
  the execution checklist (after line 39) and before
  "## User Input". The block MUST instruct the agent to:
  (1) initialize TodoWrite with all checklist phases as
  `pending`, (2) mark each phase `in_progress`/`completed`
  as it executes, (3) on resume, re-initialize from
  checklist state. Reference FR-001, FR-002, FR-003,
  FR-004.

- [x] 1.4 [P] Add TodoWrite instruction block to
  `.opencode/commands/uf.address-feedback.md`. Insert
  after the execution checklist (after line 55) and
  before "## Phase 1: Ingest". The block MUST instruct the agent to:
  (1) initialize TodoWrite with all 4 phases and
  sub-steps as `pending`, (2) mark each phase/sub-step
  `in_progress`/`completed` as it executes, (3) on resume,
  re-initialize from checklist state. Reference FR-001,
  FR-002, FR-003, FR-004.

## 2. Verification

- [x] 2.1 Verify that all 4 command files contain the
  TodoWrite instruction block. Grep for "TodoWrite" in
  each file and confirm the instruction appears between
  the execution checklist and the first step/phase.

- [x] 2.2 Verify scaffold copy byte-identity by running:
  `go test -race -count=1 -run TestEmbeddedAssets_MatchSource ./internal/scaffold/`
  All 4 modified command files MUST pass the drift
  detection test.

- [x] 2.3 Verify constitution alignment: confirm no
  new dependencies are introduced (Composability First),
  no artifact formats are changed (Autonomous
  Collaboration), and observability is improved
  (Observable Quality). This is a review-time check,
  not a code change.

<!-- spec-review: passed -->
<!-- code-review: passed -->
