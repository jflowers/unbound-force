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

## 1. Add AskUserQuestion gate to finale Step 4

- [x] 1.1 Update `.opencode/commands/finale.md` Step 4
  ("Push to Remote", lines 157-166). Replace the
  current push block with:
  1. Keep the existing upstream check
     (`git rev-parse --abbrev-ref @{upstream}`)
  2. Add a divergence warning: fetch the remote branch
     state with `git fetch origin <branch>` and
     `git status` before the gate
  3. Add AskUserQuestion gate immediately before
     `git push` with options:
     `["Push to remote", "Abort -- keep commits local"]`
  4. Only execute `git push` (or
     `git push -u origin <branch>`) if the user selects
     "Push to remote"
  5. If the user selects "Abort -- keep commits local",
     report that local commits are preserved and
     **STOP**
  6. Keep the existing push failure handling

## 2. Update scaffold asset copy

- [x] 2.1 Copy the updated `.opencode/commands/finale.md`
  to `internal/scaffold/assets/opencode/commands/finale.md`
  so both files are byte-identical. This satisfies
  FR-002 (scaffold asset parity) and ensures the
  scaffold drift detection test passes.

## 3. Verification

- [x] 3.1 Run `make check` to verify lint, tests,
  and build all pass. The scaffold drift detection
  test MUST pass, confirming both copies are
  byte-identical.
- [x] 3.2 Verify constitution alignment: confirm the
  change supports Principle V (Security by Default)
  by adding a structural security control before an
  irreversible external action.
<!-- spec-review: passed -->
<!-- code-review: passed -->
