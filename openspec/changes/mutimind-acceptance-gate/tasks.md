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

## 1. Add confirmation gate to Acceptance Authority section

- [x] 1.1 Add AskUserQuestion instruction text to `.opencode/agents/muti-mind-po.md` immediately before the `go run cmd/mutimind/main.go decide` command block (lines 69-72). The new instruction MUST require the agent to present the backlog item ID, decision type, and rationale summary, with options `["Confirm decision", "Abort"]`. The agent MUST NOT invoke the CLI command unless the user selects "Confirm decision". If the user selects "Abort", the agent MUST report cancellation and stop.

## 2. Verification

- [x] 2.1 Verify the confirmation gate text appears before the CLI command block, follows the pattern of the "Interactive Approval" rule at line 60, and satisfies all three scenarios in `specs/acceptance-gate.md`: user confirms (invoke CLI), user aborts (report cancellation and stop), and content accuracy (displays item ID, decision, rationale)
- [x] 2.2 Verify no Go source files were modified (this change is agent-instruction-only)
- [x] 2.3 Verify constitution alignment: the change maintains Composability First (no new dependencies), Observable Quality (artifact format unchanged), and Security by Default (irreversible action now gated)
<!-- spec-review: passed -->
<!-- code-review: passed -->
