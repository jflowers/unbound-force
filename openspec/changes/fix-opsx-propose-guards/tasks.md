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

## 1. Add STOP HERE preamble to both files

- [x] 1.1 [P] In `.opencode/commands/opsx-propose.md`, insert a
  bolded preamble block immediately after the `---` separator
  (line 14) and before `**Input**` (line 16). The preamble MUST
  state: this command creates artifacts ONLY, NEVER implement code
  changes, NEVER commit/push/create PRs, NEVER run /unleash,
  /opsx-apply, or /cobalt-crush. Use bold formatting and explicit
  "NEVER" language. Retain the existing STOP HERE block after Step 6
  unchanged.

- [x] 1.2 [P] In `.opencode/skills/openspec-propose/SKILL.md`,
  insert an identical bolded preamble block immediately after the
  `---` separator (line 21) and before `**Input**` (line 23). Same
  content as 1.1. Retain the existing STOP HERE block after Step 6
  unchanged.

## 2. Add explicit AskUserQuestion to dirty-tree guard

- [x] 2.1 [P] In `.opencode/commands/opsx-propose.md`, after the
  dirty-tree detection prose (lines 44-57), add an explicit
  AskUserQuestion tool call block:
  ```
  Use **AskUserQuestion** with options:
    - "Stash changes and continue"
    - "Abort -- keep changes as-is"
  If the user selects "Abort", STOP the workflow immediately.
  If the user selects "Stash changes and continue", run
  `git stash --include-untracked`. If the stash fails, STOP
  and report the failure. If the stash succeeds, proceed with
  branch creation.
  ```
  Keep the existing prose description intact -- the tool call block
  is additive.

- [x] 2.2 [P] In `.opencode/skills/openspec-propose/SKILL.md`,
  apply the same AskUserQuestion block (including stash execution
  and failure handling) after the dirty-tree detection prose
  (lines 51-64). Identical content to 2.1.

## 3. Verification

- [x] 3.1 Structural verification: inspect the final content of
  `.opencode/commands/opsx-propose.md` and
  `.opencode/skills/openspec-propose/SKILL.md`. Confirm:
  (a) STOP HERE preamble appears before the first numbered step
      (the preamble's byte offset MUST be lower than the first
      `1. **` pattern)
  (b) AskUserQuestion tool call with two options appears in the
      dirty-tree guard section, followed by `git stash` failure
      handling
  (c) Existing STOP HERE block after Step 6 is retained
  (d) No other content was inadvertently modified
  (e) Both files contain matching guard sections (preamble text
      and AskUserQuestion block are identical between command
      and skill)

- [x] 3.2 Review the constitution alignment assessment in
  proposal.md and confirm it remains accurate after
  implementation. Verify Principle IV (Testability) and
  Principle V (Security by Default) are satisfied. Changes are
  instruction hardening only -- no source code, no artifact
  format changes.
<!-- spec-review: passed -->
<!-- code-review: passed -->
