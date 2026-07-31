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

## 1. Add AskUserQuestion enforcement to dirty-tree guard

- [x] 1.1 [P] Update `.opencode/skills/openspec-propose/SKILL.md` — in the "Dirty working tree check" subsection under step 3 ("Create and checkout a branch"), augment the prose-only dirty-tree guard with an explicit AskUserQuestion tool call. After `git status --short` detects any non-empty output, add instruction to invoke AskUserQuestion showing the `git status` output, target branch name, and a warning. Options: "Stash changes and continue" / "Abort — keep changes as-is". Agent MUST NOT proceed to `git checkout -b` until user responds. If user selects "Abort", stop workflow. If user selects "Stash", run `git stash`, verify `git status --short` is empty, then proceed. If `git stash` fails (non-zero exit), abort and report.

- [x] 1.2 [P] Update `.opencode/commands/opsx-propose.md` — apply the identical fix to the companion command file's "Dirty working tree check" subsection under step 3. Same AskUserQuestion enforcement, same options, same stash failure handling, same behavior as task 1.1.

## 2. Verification

- [x] 2.1 Verify both files contain an explicit AskUserQuestion tool-call instruction in the dirty-tree guard section with options "Stash changes and continue" / "Abort — keep changes as-is". Verify the tool-call instruction appears after the `git status --short` detection step and before any `git checkout -b` instruction. Confirm no prose-only guard exists as the sole enforcement mechanism without an accompanying AskUserQuestion tool-call instruction (existing prose context per D3 is retained alongside the tool call).

- [x] 2.2 Verify constitution alignment — confirm the changes do not introduce runtime coupling (Principle I), mandatory dependencies (Principle II), or untestable components (Principle IV). Confirm the fix strengthens Security by Default (Principle V) by closing a gate bypass.
<!-- spec-review: passed -->
<!-- code-review: passed -->
