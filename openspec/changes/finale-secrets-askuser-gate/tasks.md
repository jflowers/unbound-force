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

## 1. Replace prose confirmation with AskUserQuestion

- [x] 1.1 In `.opencode/commands/uf.finale.md`, locate the
  secrets check confirmation at lines 80-81 (the text
  "Ask for confirmation. If the user declines, stop and
  let them handle it manually.") and replace it with an
  explicit AskUserQuestion tool call block:

  ```
  Use the **AskUserQuestion tool** with options
  `["Yes -- stage all files and continue", "No -- stop here"]`.

  - If the user selects **"Yes -- stage all files and
    continue"**: proceed to `git add .`.
  - If the user selects **"No -- stop here"**: **STOP**.
    Do not run `git add .`. Do not proceed to Step 3 or
    any subsequent steps. Report that the user declined
    and let them handle the secret files manually.
  ```

  The existing warning message block (lines 71-78) MUST
  be preserved unchanged. Only the confirmation mechanism
  (lines 80-81) is replaced.

- [x] 1.2 In `internal/scaffold/assets/opencode/commands/
  uf.finale.md`, apply the identical edit to keep the
  scaffold copy in sync.

  **Note**: Tasks 1.1 and 1.2 are NOT marked [P] because
  they modify files that share identical content and the
  edit must be verified as identical. Sequential execution
  ensures consistency.

## 2. Verification

- [x] 2.1 Run `make test` to verify existing drift
  detection tests pass (scaffold asset matches command
  file).

- [x] 2.2 Verify the AskUserQuestion pattern in the
  modified file matches the established push gate pattern
  at line 175 (same file). Confirm both gates use:
  (a) explicit AskUserQuestion tool call,
  (b) exactly two options,
  (c) explicit STOP instruction on decline.

- [x] 2.3 Verify constitution alignment: confirm the
  change does not introduce runtime coupling (Principle I),
  mandatory dependencies (Principle II), or untestable
  components (Principle IV). The change strengthens
  Principle V (Security by Default) by enforcing the
  secrets confirmation gate.

<!-- spec-review: passed -->
<!-- code-review: passed -->
