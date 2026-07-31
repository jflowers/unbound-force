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

## 1. Add AskUserQuestion gate to step 4

All tasks in this group modify the same file
(`.opencode/commands/speckit.clarify.md`), so none are
parallel-eligible.

- [x] 1.1 Add a prominent gate marker at the start of step 4
  (line 100) with horizontal rule and bold header:
  `**MANDATORY GATE — AskUserQuestion Required**`. Insert
  the following constraint text immediately after the step 4
  heading and before the existing "Present EXACTLY ONE question"
  line:
  ```
  Each question MUST be delivered as a single
  **AskUserQuestion tool call**. Do NOT present the next
  question until the previous AskUserQuestion response has
  been received. Do NOT batch questions together.
  ```

- [x] 1.2 Update the multiple-choice question format (lines
  102-119) to specify AskUserQuestion tool usage. After the
  existing Markdown table format instructions, add:
  ```
  Deliver the question using the **AskUserQuestion tool**
  with options matching the table rows. List the
  recommended option first with "(Recommended)" appended
  to its label. Enable custom text for free-form
  alternatives.
  ```

- [x] 1.3 Update the short-answer question format (lines
  120-123) to specify AskUserQuestion tool usage. After the
  existing format instructions, add:
  ```
  Deliver the question using the **AskUserQuestion tool**
  in open-ended mode (no preset options). Include the
  suggested answer in the question text.
  ```

- [x] 1.4 Update the "After the user answers" section (lines
  124-128) to reference the AskUserQuestion tool response
  rather than generic "user replies". Replace "If the user
  replies" with "When the AskUserQuestion tool returns a
  response" to reinforce tool-mediated interaction. Preserve
  all existing response handling logic (recommendation
  acceptance, option validation, disambiguation).

## 2. Verification

- [x] 2.1 Verify the modified speckit.clarify.md is valid
  Markdown and all existing step numbers, heading hierarchy,
  and cross-references remain intact

- [x] 2.2 Verify constitution alignment: confirm no
  constitution principles are violated by the change
  (Testability PASS — tool call is a verifiable gate;
  Composability PASS — no new dependencies introduced)

- [x] 2.3 Verify no scaffold copies exist that need
  synchronized updates (confirm speckit.clarify.md is only
  in `.opencode/commands/`, not in
  `cmd/unbound-force/.opencode/command/` or
  `internal/scaffold/.opencode/command/`)

- [x] 2.4 Verify AskUserQuestion pattern consistency: confirm
  the new AskUserQuestion language uses the same phrasing
  pattern as existing commands (bold formatting
  `**AskUserQuestion tool**`, verb pattern "Use the" /
  "Deliver ... using the", options/open-ended mode
  terminology). Cross-reference against review-pr.md,
  address-feedback.md, and triage-issue.md for consistency
<!-- spec-review: passed -->
<!-- code-review: passed -->
