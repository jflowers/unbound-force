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

## 1. Add session-resume guard

- [x] 1.1 Add session-resume guard blockquote to
  `.opencode/commands/uf.review-council.md` immediately
  after the `# Command: /uf.review-council` heading
  (line 5) and before `## User Input` (line 7). The
  guard MUST instruct the agent to re-read the template
  on session resume, check the execution checklist for
  actual completion state, and not infer step completion
  from compressed summaries. (FR-001)

## 2. Add execution checklist

- [x] 2.1 Add execution checklist blockquote to
  `.opencode/commands/uf.review-council.md` between
  the session-resume guard and the `## User Input`
  section. The checklist MUST list all phases and
  steps with checkbox markers: Phase 1a, Phase 1b,
  Phase 1c, Step 2, Step 3, Step 4 (with iteration
  counter `_/3`), Step 5, Step 6, Step 7a-7g. Step 7f
  MUST include `(MANDATORY GATE)` annotation. Include
  an instruction to update each item using the Edit
  tool. (FR-002)

## 3. Add step-level checkpoint reminders

- [x] 3.1 Add checkpoint reminder at the end of Phase 1a
  (after the verdict handling, before Phase 1b heading).
  Format: `**Checkpoint**: Mark Phase 1a complete in
  the EXECUTION CHECKLIST using the Edit tool before
  proceeding.` (FR-003)

- [x] 3.2 Add checkpoint reminder at the end of Phase 1b
  (after the Gaze skip note, before Phase 1c heading).
  (FR-003)

- [x] 3.3 Add checkpoint reminder at the end of Phase 1c
  (after the review context recording, before Step 2).
  (FR-003)

- [x] 3.4 Add checkpoint reminder at the end of Step 2
  (after the enrichment instructions, before Step 3).
  (FR-003)

- [x] 3.5 Add checkpoint reminder at the end of Step 3
  (after the consolidation rules, before Step 4).
  (FR-003)

- [x] 3.6 Add checkpoint reminder at the end of Step 4
  with iteration tracking instruction: `**Checkpoint**:
  Update Step 4 iteration counter in the EXECUTION
  CHECKLIST (e.g., iteration: 2/3) using the Edit
  tool.` (FR-003, FR-002)

- [x] 3.7 Add checkpoint reminder at the end of Step 5.
  (FR-003)

- [x] 3.8 Add checkpoint reminder at the end of Step 6
  (after the final report structure, before Step 7).
  (FR-003)

## 4. Add MANDATORY GATE markers to Step 7f

- [x] 4.1 Wrap the Step 7f confirmation section (starting
  at "Map the council verdict to the GitHub API event
  type" through the CRITICAL RULE) with:
  - Opening: `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
  - Closing: `>>> END MANDATORY GATE <<<`
  Add a session-resume guard within the gate section
  referencing the execution checklist. (FR-004, FR-006)

## 5. Add checkpoint reminders to Step 7 sub-steps

- [x] 5.1 Add checkpoint reminders at the end of Steps
  7a, 7b, 7c, 7d, 7e, and 7g. Step 7f checkpoint
  is handled by the MANDATORY GATE section (Task 4.1).
  (FR-003)

## 6. Sync scaffold copy

- [x] 6.1 [P] Copy the updated
  `.opencode/commands/uf.review-council.md` to
  `internal/scaffold/assets/opencode/commands/uf.review-council.md`
  to maintain byte-identical copies. (FR-005)

## 7. Verification

- [x] 7.1 Verify session-resume guard appears exactly
  once in the file, before the `## User Input` section.

- [x] 7.2 Verify execution checklist contains all 15
  phases/steps with checkbox markers.

- [x] 7.3 Verify `MANDATORY GATE` markers appear exactly
  twice in the file (opening and closing).

- [x] 7.4 Verify checkpoint reminders appear at each
  phase/step boundary (count: at least 12 checkpoint
  lines).

- [x] 7.5 Verify scaffold copy is byte-identical:
  `diff .opencode/commands/uf.review-council.md internal/scaffold/assets/opencode/commands/uf.review-council.md`

- [x] 7.6 Verify constitution alignment: changes are
  additive-only (no behavioral changes to review
  workflow), maintain Observable Quality (checklist
  state is trackable), and maintain Testability
  (marker counts are grep-verifiable).

- [x] 7.7 Run `make check` to verify no build/lint/test
  regressions.
<!-- spec-review: passed -->
<!-- code-review: passed -->
