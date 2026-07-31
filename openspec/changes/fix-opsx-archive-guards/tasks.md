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

## 1. Fix target-exists guard clarity (Gap B)

- [x] 1.1 In `.opencode/commands/opsx-archive.md` Step 5
  ("Perform the archive"), add explicit conditional language
  before the `mv` command code fence to make it clear that
  the command runs only when the target does not exist. The
  target-exists check (starting with "Check if target already
  exists") already precedes the `mv` block; the fix is to add
  guard text such as "If the target does not exist, execute:"
  before the `mv` code fence so agents treat it as conditional
  rather than unconditional.
- [x] 1.2 [P] In `.opencode/skills/openspec-archive-change/SKILL.md`
  Step 6 ("Perform the archive"), apply the same fix: add
  explicit conditional language before the `mv` command code
  fence to link it to the target-exists check.

## 2. Add branch switch confirmation gate (Gap A)

- [x] 2.1 In `.opencode/commands/opsx-archive.md` Step 6
  ("Return to main branch"), add an `AskUserQuestion`
  confirmation gate before `git checkout main`. The gate
  MUST use the `AskUserQuestion tool` with options
  `["Return to main", "Stay on branch"]`. If the user
  selects "Stay on branch", skip the `git checkout main`
  and note in the summary that the user remained on the
  `opsx/<name>` branch.
- [x] 2.2 [P] In `.opencode/skills/openspec-archive-change/SKILL.md`
  Step 7 ("Return to main branch"), add an `AskUserQuestion`
  confirmation gate before `git checkout main` with the same
  two options and conditional behavior. Note: the SKILL.md
  Step 7 has a commit/push sub-step before the checkout — the
  gate goes after the commit/push and before `git checkout
  main`.

## 3. Update summary output templates

- [x] 3.1 In `.opencode/commands/opsx-archive.md`, update
  the summary display step (Step 7) and all three standalone
  output template blocks ("Output On Success", "Output On
  Success (No Delta Specs)", "Output On Success With
  Warnings") to include a conditional `**Branch:**` line.
  Show `**Branch:** returned to main` or `**Branch:** stayed
  on opsx/<name>` depending on the user's choice in the
  confirmation gate. The current templates do not have a
  branch status field — this line needs to be added, not
  replaced.
- [x] 3.2 [P] In `.opencode/skills/openspec-archive-change/SKILL.md`,
  update the summary display step (Step 8) and the output
  template block to include the same conditional
  `**Branch:**` line.

## 4. Verification

- [x] 4.1 Read the updated `.opencode/commands/opsx-archive.md`
  and verify: (a) the `mv` command in Step 5 has explicit
  conditional language linking it to the target-exists check,
  (b) Step 6 contains the `AskUserQuestion` gate with the
  exact options "Return to main" and "Stay on branch",
  (c) the "Stay on branch" path skips `git checkout main`
  and updates the summary, (d) the summary templates reflect
  conditional branch status, (e) no constitution principles
  are violated (per proposal.md assessment).
- [x] 4.2 [P] Read the updated
  `.opencode/skills/openspec-archive-change/SKILL.md` and
  verify the same criteria as 4.1 applied to the skill file.
<!-- spec-review: passed -->
<!-- code-review: passed -->
