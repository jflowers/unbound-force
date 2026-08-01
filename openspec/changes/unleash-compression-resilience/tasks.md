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

## 1. Add Compression Resilience to Canonical Template

All tasks in this group modify the same file
(`.opencode/commands/uf.unleash.md`), so they MUST run
sequentially. No `[P]` markers.

- [ ] 1.1 Add session-resume guard blockquote at the beginning of
  the Instructions section (after `## Instructions`, before
  `### 0. Startup Cleanup`). The guard MUST instruct the agent
  to: (a) re-read the full template on resume, (b) not infer
  step completion from compressed context summaries, (c) treat
  only filesystem markers as authoritative for resumability,
  (d) maintain the execution checklist using the Edit tool.
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.2 Add execution checklist immediately after the
  session-resume guard. The checklist MUST track: current step
  (0-8) with name, current phase in Step 5 (Phase N/M), fix
  loop iteration for Steps 4 and 6 (iteration N/3), and
  parallel worker batch progress (batch N/M, workers done/total).
  Include an instruction for the agent to update the checklist
  in-place using the Edit tool as each milestone completes.
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.3 Add checkpoint reminder at the end of Step 0 (Startup
  Cleanup) in blockquote format:
  `> CHECKPOINT: Mark Step 0 complete in the execution checklist
  before proceeding.`
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.4 Add checkpoint reminder at the end of Step 1 (Branch
  Safety Gate).
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.5 Add checkpoint reminder at the end of Step 2
  (Resumability Detection). Also add an explicit note that
  compressed context summaries are NOT valid resumability
  indicators -- only filesystem markers are authoritative.
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.6 Add checkpoint reminder at the end of Step 3 (Clarify).
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.7 Add checkpoint reminder at the end of Step 4 (Plan).
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.8 Add checkpoint reminder at the end of Step 5 (Tasks).
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.9 Add checkpoint reminders to Step 6 (Spec Review):
  one at each fix loop iteration boundary (`> CHECKPOINT:
  Update execution checklist -- iteration N/3.`) and one at the
  end of the step.
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.10 Add checkpoint reminders to Step 7 (Implement): one at
  each phase boundary (`> CHECKPOINT: Update execution checklist
  -- Phase N/M complete.`) and one for parallel worker batch
  completion. Also add a checkpoint at the end of the step.
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.11 Add checkpoint reminders to Step 8 (Code Review):
  one at each fix loop iteration boundary and one at the end of
  the step.
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.12 Add checkpoint reminder at the end of Step 9
  (Retrospective).
  File: `.opencode/commands/uf.unleash.md`

- [ ] 1.13 Add checkpoint reminder at the end of Step 10 (Demo).
  File: `.opencode/commands/uf.unleash.md`

## 2. Sync Scaffold Copy

- [ ] 2.1 Copy the updated canonical template to the scaffold
  location. The scaffold copy MUST be identical to the canonical
  copy.
  File: `internal/scaffold/assets/opencode/commands/uf.unleash.md`
  Source: `.opencode/commands/uf.unleash.md`

## 3. Verify

- [ ] 3.1 Run drift detection tests to confirm canonical and
  scaffold copies are in sync:
  `go test -race -count=1 ./internal/scaffold/...`

- [ ] 3.2 Run full test suite to verify no regressions:
  `go test -race -count=1 ./...`

- [ ] 3.3 Verify constitution alignment: confirm that the changes
  are purely additive (no pipeline logic changes), maintain
  artifact-based resumability (Principle I), and do not introduce
  new dependencies (Principle II).
