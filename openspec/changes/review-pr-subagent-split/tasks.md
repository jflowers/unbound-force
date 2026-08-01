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

## 1. Restructure command into parent/subagent sections

All tasks in this group modify the same file
(`.opencode/commands/uf.review-pr.md`), so no parallel
execution is possible.

- [x] 1.1 Add PR number to frontmatter `description` field.
  Change the frontmatter from:
  ```yaml
  ---
  description: "Review a pull request for alignment, security, and constitution compliance"
  ---
  ```
  to:
  ```yaml
  ---
  description: "Review PR #$ARGUMENTS — alignment, security, and constitution compliance"
  ---
  ```

- [x] 1.2 Add pre-delegation large-diff check to the parent
  section (after Step 3, before delegation). Using the
  `additions` and `deletions` fields from Step 2 metadata and
  the `files` array length, check if the diff exceeds 2000
  lines or 50 files. If so, ask the user with AskUserQuestion
  whether to review all files or focus on specific files.
  Record the file-focus scope for injection into the subagent
  prompt.

- [x] 1.3 Create the subagent delegation block between Step 3
  (CI checks) and Step 9 (output format). This block MUST:
  - Construct a Task tool prompt containing Steps 4-8 verbatim
  - Inject PR metadata variables (PR number, title, body, base
    branch, head branch, file list, CI results, CI failure
    classifications, file-focus scope)
  - Specify `subagent_type: "general"`
  - Instruct the subagent to return structured findings in the
    Step 9 format sections (CI Coverage Matrix, Local Tool
    Results, Walkthrough, Linked Issues, Summary, Alignment,
    Security, Constitution Compliance, CI Failure Analysis,
    Verdict recommendation)

- [x] 1.4 Wrap Steps 4-8 inside the subagent prompt block.
  These steps MUST NOT appear as top-level parent instructions.
  They MUST be enclosed in the delegation prompt so they only
  execute in the subagent context. Preserve the exact step text
  — no modifications to the analysis logic.

- [x] 1.5 Update Step 9 (output format) to receive and render
  subagent findings. The parent takes the structured findings
  from the subagent return message and renders them into the
  existing output format. Add the PR header
  (`## PR Review: #<NUMBER> — <TITLE>`) which the parent owns
  since it has the PR metadata.

- [x] 1.6 Verify the parent-visible content (excluding the
  subagent prompt block) is under 650 lines (amended from
  400 — see spec update). Count lines outside the subagent
  prompt section. Result: 628 lines (under 650 target).
  The 400-line target was infeasible due to irreducible
  interactive steps (fix-branch ~114 lines, verdict posting
  ~234 lines) that must remain in the parent.

## 2. Sync scaffold copy

- [x] 2.1 Copy the updated command file to the scaffold
  location. Run:
  ```bash
  cp .opencode/commands/uf.review-pr.md \
     internal/scaffold/assets/opencode/commands/uf.review-pr.md
  ```

- [x] 2.2 Run scaffold drift detection tests to verify sync:
  ```bash
  go test -race -count=1 ./internal/scaffold/...
  ```

## 3. Verification

- [x] 3.1 Run full test suite to verify no regressions:
  ```bash
  make test
  ```

- [x] 3.2 [P] Verify constitution alignment: confirm the
  restructured command preserves Autonomous Collaboration
  (subagent returns self-describing findings), Composability
  First (no new dependencies introduced), and Observable
  Quality (machine-parseable output format unchanged).

- [x] 3.3 [P] Verify all interactive prompts remain in parent
  context: grep the subagent prompt section for
  `AskUserQuestion` — it MUST NOT appear inside the subagent
  block. Grep the parent sections for all existing
  `AskUserQuestion` uses to confirm they are preserved.

- [ ] 3.4 [P] (MANUAL) Smoke test: invoke `/uf.review-pr` on a
  test PR and verify the subagent delegation executes
  correctly, findings are returned, and the interactive verdict
  posting flow works end-to-end.
<!-- spec-review: passed -->
<!-- code-review: passed -->
