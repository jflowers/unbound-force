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

## 1. Move STOP HERE blocks to preamble position

Each task below modifies a single file. The operation
for each file is identical:

1. Insert the STOP HERE block (6 lines) immediately
   after the first major heading following the User
   Input section (with a blank line before and after).
2. Remove the original STOP HERE block from its current
   position at the end of the file (including
   surrounding blank lines).
3. Verify exactly one STOP HERE block remains.

The STOP HERE block content (identical for all files):

```
**STOP HERE. Do NOT proceed to implementation.**

Your job is done. Report the results and prompt the
user. The user will invoke a separate command
(/uf.unleash, /uf.cobalt-crush, or /opsx-apply) when they
are ready to implement.
```

Reference pattern: `.opencode/commands/speckit.tasks.md`
lines 25-30 and `.opencode/commands/speckit.plan.md`
lines 24-29.

- [x] 1.1 [P] **speckit.specify.md**: Insert STOP block after `## Outline` (line 22), before the paragraph at line 24. Remove original STOP block at line 236. File: `.opencode/commands/speckit.specify.md`

- [x] 1.2 [P] **speckit.clarify.md**: Insert STOP block after `## Outline` (line 18), before the Goal paragraph at line 20. Remove original STOP block at line 185. File: `.opencode/commands/speckit.clarify.md`

- [x] 1.3 [P] **speckit.analyze.md**: Insert STOP block after `## Goal` (line 14), before the goal description at line 16. Remove original STOP block at line 166. File: `.opencode/commands/speckit.analyze.md`

- [x] 1.4 [P] **speckit.checklist.md**: Insert STOP block after `## Execution Steps` heading (line 35), before step 1 at line 37. Remove original STOP block at line 223. File: `.opencode/commands/speckit.checklist.md`

- [x] 1.5 [P] **speckit.testreview.md**: Insert STOP block after `## Goal` (line 14), before the goal description at line 16. Remove original STOP block at line 119. File: `.opencode/commands/speckit.testreview.md`

## 2. Verification

- [x] 2.1 Verify each of the 5 files contains exactly one `**STOP HERE` block. Run: `rg -c "STOP HERE" .opencode/commands/speckit.{specify,clarify,analyze,checklist,testreview}.md` — each file should show count 1.

- [x] 2.2 Verify the STOP block appears before the first numbered step in each file. For each file, confirm the STOP block line number is less than the first `1.` or `### 1.` line number.

- [x] 2.3 Verify the 2 already-fixed files (`speckit.tasks.md`, `speckit.plan.md`) are untouched. Run: `git diff .opencode/commands/speckit.tasks.md .opencode/commands/speckit.plan.md` — should produce no output.
<!-- spec-review: passed -->
<!-- code-review: passed -->
