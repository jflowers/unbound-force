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

## 1. Move STOP HERE Gates

- [x] 1.1 [P] In `.opencode/commands/speckit.tasks.md`,
  remove the STOP HERE block (the block starting with
  `**STOP HERE. Do NOT proceed to implementation.**`)
  from between step 5 and step 6 (approximately lines
  70-75) and insert it as a bolded preamble immediately
  after the `## Outline` heading, before step 1
- [x] 1.2 [P] In `.opencode/commands/speckit.plan.md`,
  remove the STOP HERE block (the block starting with
  `**STOP HERE. Do NOT proceed to implementation.**`)
  from after step 4 (approximately lines 39-44) and
  insert it as a bolded preamble immediately after the
  `## Outline` heading, before step 1

## 2. Verification

- [x] 2.1 Verify both files have the STOP HERE block
  positioned before step 1 (grep for "STOP HERE" and
  confirm line numbers precede workflow steps)
- [x] 2.2 Verify no duplicate STOP HERE blocks exist
  in either file (each file should have exactly one)
- [x] 2.3 Verify STOP HERE text is identical to the
  original (no wording changes)
- [x] 2.4 Verify constitution alignment: all principles
  are N/A for this text-only change (no code, no
  artifacts, no test changes)
- [x] 2.5 Verify no Go source, test files, or schema
  files were modified by this change
- [x] 2.6 File a follow-up issue (#386) to apply
  preamble placement to the remaining 5 speckit commands
  (`speckit.specify.md`, `speckit.clarify.md`,
  `speckit.analyze.md`, `speckit.checklist.md`,
  `speckit.testreview.md`)

<!-- spec-review: passed -->
<!-- code-review: passed -->
