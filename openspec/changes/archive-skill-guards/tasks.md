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

## 1. Add commit-state confirmation gate

All tasks modify the same file
(`.opencode/skills/openspec-archive-change/SKILL.md`),
so no [P] markers — sequential execution required.

- [x] 1.1 Insert `AskUserQuestion` gate between step 5
  and step 6 in `SKILL.md`. Add the gate after the
  CRITICAL prose warning (ending with "lost entirely.")
  and before the "6. **Perform the archive**" header.
  The gate MUST include a `git status --short` check
  before presenting the prompt. The gate MUST use these
  options: "Changes committed and pushed — proceed to
  archive", "Abort — need to commit first". Include
  abort behavior: if user selects abort, display which
  steps completed and stop execution immediately.

- [x] 1.2 Add session-resume guard language to the gate
  instruction. State that this gate MUST be presented
  fresh in every session regardless of prior compressed
  context — compressed session state MUST NOT be treated
  as implicit authorization.

## 2. Add branch-switch confirmation gate

- [x] 2.1 Insert `AskUserQuestion` gate before the
  `git checkout main` command in step 7 of `SKILL.md`.
  The gate MUST use these options: "Return to main",
  "Stay on branch". If user selects "Stay on branch",
  skip the checkout and proceed to step 8 (summary),
  noting the user remained on the opsx branch.

## 3. Verification

- [x] 3.1 Verify the modified `SKILL.md` preserves all
  existing step numbering and content — the gates are
  additive insertions, not replacements of existing
  instructions. Method: use `git diff` to confirm only
  additive insertions were made; verify step headers
  (1-8) are unchanged and in order.

- [x] 3.2 Verify constitution alignment: confirm the
  change does not violate any of the five org
  constitution principles. Per the proposal, all
  principles are N/A except Principle V (Security by
  Default) which is PASS. Method: review each principle
  against the proposal's alignment assessment.

- [x] 3.3 Verify consistency with issue #356 pattern:
  confirm the branch-switch gate options ("Return to
  main" / "Stay on branch") match the canonical wording.
  Method: if issue #356 has been applied to
  `opsx-archive.md`, verify wording consistency with
  that file. If #356 is not yet applied, verify the
  gate options match this spec's requirement text and
  note that `opsx-archive.md` should use the same
  wording when #356 is implemented.
<!-- spec-review: passed -->
<!-- code-review: passed -->
