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

## 1. Move STOP HERE blocks to preamble position

Each file requires removing the STOP HERE block from its
current position and inserting it immediately after the
`## Outline` heading, before the first numbered step.
The block content MUST be preserved exactly.

Fixes: https://github.com/unbound-force/unbound-force/issues/363

- [x] 1.1 [P] Move STOP HERE block in `.opencode/commands/speckit.tasks.md`: Remove the STOP HERE block (lines 70-75) from after Step 5, and insert it immediately after the `## Outline` heading (after line 23), before Step 1. Verify exactly one "STOP HERE" match remains in the file.

- [x] 1.2 [P] Move STOP HERE block in `.opencode/commands/speckit.plan.md`: Remove the STOP HERE block (lines 39-44) from after Step 4, and insert it immediately after the `## Outline` heading (after line 22), before Step 1. Verify exactly one "STOP HERE" match remains in the file.

- [x] 1.3 [P] Update STOP HERE placement instruction in `.opencode/commands/uf-init.md`: In Step 10, change the "Where" instruction (lines 797-799) from "After the main workflow instructions, before the `## Guardrails` section" to "Immediately after the `## Outline` heading (or equivalent section heading), before the first numbered workflow step. If no `## Outline` heading exists, insert before the first numbered step in the file."

## 2. Verification

- [x] 2.1 Verify each affected file contains exactly one STOP HERE block, positioned before the first numbered workflow step. Confirm no content was lost during the move (the block wording and the Guardrails section remain intact and unchanged in each file).
<!-- spec-review: passed -->
<!-- code-review: passed -->
