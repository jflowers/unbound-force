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

## 1. Harden dirty-tree check

- [x] 1.1 [P] Replace the prose-only dirty-tree check in
  `.opencode/skills/speckit-workflow/SKILL.md` Pre-conditions
  section (lines 38-44) with an explicit `AskUserQuestion`
  block. Match the pattern from `speckit.specify.md` lines
  42-67: include `git status --short` output in the question,
  offer "Stash changes and continue" and "Abort -- keep
  changes as-is" options, handle stash failure (abort on
  non-zero exit), re-verify clean tree after stash, and add
  post-workflow stash restore reminder.
- [x] 1.2 [P] Apply the identical replacement to the scaffold
  copy at
  `internal/scaffold/assets/opencode/skills/speckit-workflow/SKILL.md`.
  The content MUST be identical to the source file after both
  edits.

## 2. Verification

- [x] 2.1 Run `make check` to verify lint, tests, and build
  pass. The scaffold drift-detection tests confirm source and
  scaffold copies match.
- [x] 2.2 Verify constitution alignment: confirm no
  Autonomous Collaboration, Composability, Observable Quality,
  Testability, or Security by Default principles are violated.
  This change hardens a security guardrail (Principle V) and
  preserves testability (Principle IV) via existing
  drift-detection tests.
<!-- spec-review: passed -->
<!-- code-review: passed -->
