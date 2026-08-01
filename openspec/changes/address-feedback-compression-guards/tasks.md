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

  Both tasks in group 1 modify the same file
  (uf.address-feedback.md), so neither is [P].
  Group 2 copies the result of group 1 to the scaffold.
  Group 3 runs verification.
-->

## 1. Add compression guards to command template

Target: `.opencode/commands/uf.address-feedback.md`

- [x] 1.1 Add session-resume guard blockquote after
  frontmatter (before Phase 1). The guard MUST instruct
  the agent to: (a) re-read the full command template on
  resume, (b) NOT infer phase completion or triage
  decisions from compressed context, (c) treat only
  `state.json` as authoritative for item state. Reference
  the pattern at `.opencode/commands/uf.review-pr.md`
  line 846 but place it at the top of the file for
  earlier visibility. (FR-001)

- [x] 1.2 Add execution checklist section after the
  session-resume guard and before Phase 1. The checklist
  template MUST include all phases and sub-steps defined
  in FR-002. Include an instruction paragraph telling the
  agent to render this checklist at execution start and
  update it in-place using the Edit tool. (FR-002)

- [x] 1.3 Add checkpoint reminder at the end of Phase 1
  (after section 1.6, before the `---` separator).
  Format: blockquote with "CHECKPOINT: Update the
  execution checklist above before proceeding to
  Phase 2." (FR-003)

- [x] 1.4 Add checkpoint reminder at the end of Phase 2
  (after section 2.6, before the `---` separator).
  Format: blockquote with "CHECKPOINT: Update the
  execution checklist above before proceeding to
  Phase 3." (FR-003)

- [x] 1.5 Add checkpoint reminder at the end of Phase 3
  (after section 3.4, before the `---` separator).
  Format: blockquote with "CHECKPOINT: Update the
  execution checklist above before proceeding to
  Phase 4." (FR-003)

- [x] 1.6 Harden Phase 4.5 posting gate. Add instruction
  requiring the agent to verify that the execution
  checklist shows Phase 3 as `[x]` with all items decided
  AND Phase 4.1-4.4 as `[x]` before presenting comments
  for posting. If the checklist is missing or incomplete,
  the agent MUST re-read the template and rebuild state.
  (FR-004)

- [x] 1.7 Add checklist tracking to Phase 4.3
  review-council section. The agent MUST update the
  checklist with iteration count and PASS/FAIL after each
  council run. (FR-005)

- [x] 1.8 Add checkpoint reminders at the end of Phase 4
  sub-steps 4.2, 4.3, 4.4, and 4.5. (FR-003)

## 2. Sync scaffold copy

Target: `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`

- [x] 2.1 Copy the updated command file to the scaffold
  assets directory, replacing the existing file. Both
  copies MUST be byte-identical. (FR-006)

## 3. Verification

- [x] 3.1 Run scaffold drift detection tests to verify
  both copies are in sync:
  `go test -race -count=1 ./internal/scaffold/...`

- [x] 3.2 Run full lint and test suite:
  `make check`

- [x] 3.3 Verify constitution alignment: confirm the
  change does not introduce runtime coupling (Principle I),
  mandatory dependencies (Principle II), or non-observable
  state (Principle III). The execution checklist satisfies
  Principle III by making workflow state observable.
<!-- spec-review: passed -->
<!-- code-review: passed -->
