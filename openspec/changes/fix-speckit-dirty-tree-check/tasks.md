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

## 1. Harden dirty-tree guard in speckit.specify.md

- [x] 1.1 Replace prose-only dirty-tree check (lines 40-50) in
  `.opencode/commands/speckit.specify.md` with an explicit
  `AskUserQuestion` tool call. Replace lines 42-50 with:
  (a) Run `git status --short` to check for uncommitted changes.
  (b) If output is non-empty, use `AskUserQuestion` with options:
      - "Stash changes and continue"
      - "Abort -- keep changes as-is"
  Include the `git status --short` output in the question context
  so the user can see which files are uncommitted.
  (c) If user selects "Stash changes and continue", run `git stash`
      before proceeding to branch creation. If `git stash` fails
      (non-zero exit), abort the workflow and report the error.
      Upon workflow completion, inform the user their changes can
      be restored with `git stash pop`.
  (d) If user selects "Abort", stop the workflow immediately.
  (e) Retain the existing exception: skip this check only if the
      user explicitly requested a new spec in the same message.
  File: `.opencode/commands/speckit.specify.md`

## 2. Verification

- [x] 2.1 Verify the modified text in `speckit.specify.md` contains
  an explicit `AskUserQuestion` tool call (not just prose) and that
  the two options match the spec: "Stash changes and continue" and
  "Abort -- keep changes as-is"
- [x] 2.2 [P] Verify constitution alignment: confirm the change
  aligns with Observable Quality (structured decision point) and
  Security by Default (explicit user confirmation for
  security-sensitive operation). No code changes, so Testability
  and Composability are N/A.
- [x] 2.3 [P] Verify the exception clause is preserved: the agent
  MAY skip the check only if the user explicitly requested a new
  spec in the same message
- [x] 2.4 [P] Check `speckit-workflow/SKILL.md` for a parallel
  prose-only dirty-tree guard. If present, file a follow-up issue
  to harden it with the same `AskUserQuestion` pattern (Filed: #395)

## 3. Documentation

- [x] 3.1 Add CHANGELOG.md entry under Unreleased/Fixed:
  "fix(speckit): harden dirty-tree check with explicit
  AskUserQuestion tool call (#358)"
<!-- spec-review: passed -->
<!-- code-review: passed -->
