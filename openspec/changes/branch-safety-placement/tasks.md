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

## 1. Restructure skill file

- [x] 1.1 Add "Pre-conditions" section after "When This Skill Applies" (line 29) and before "Reading tasks.md" (line 30) in `.opencode/skills/speckit-workflow/SKILL.md`. Insert a `## Pre-conditions` heading followed by the CRITICAL branch safety content (currently at lines 116-128). Include the `**CRITICAL**:` label and all four bullet points verbatim.
- [x] 1.2 Remove the original "Branch Safety" section (lines 114-129) from `.opencode/skills/speckit-workflow/SKILL.md`, including the `## Branch Safety` heading and the blank line before it.

## 2. Verification

- [x] 2.1 Verify the "Pre-conditions" section appears before "Reading tasks.md" in the updated file
- [x] 2.2 Verify no "Branch Safety" heading exists after the workflow sections
- [x] 2.3 Verify all four original branch safety rules are present in the "Pre-conditions" section
- [x] 2.4 Run `make check` to confirm no build, lint, or test regressions
<!-- spec-review: passed -->
<!-- code-review: passed -->
