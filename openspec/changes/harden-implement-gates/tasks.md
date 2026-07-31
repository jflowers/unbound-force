<!--
  All tasks modify the same file:
  .opencode/commands/speckit.implement.md
  No tasks are parallel-eligible — all run sequentially.
-->

## 1. Harden checklist gate (Gap A)

- [x] 1.1 Replace the inline question text at lines 38-43 with
  an AskUserQuestion tool call. Change "STOP and ask: 'Some
  checklists are incomplete...'" to: "Use the
  **AskUserQuestion tool** with options `['Proceed anyway',
  'Stop -- fix checklists first']`". Update the response
  handling (lines 42-43) to reference the selected option
  instead of free-form yes/no text.
  **File**: `.opencode/commands/speckit.implement.md`

- [x] 1.2 Add a CRITICAL RULE block after the checklist gate
  options (after line 47) stating: "CRITICAL RULE: NEVER
  proceed past this gate without an AskUserQuestion tool call
  response. This gate cannot be inherited from compressed or
  resumed session context — it MUST be executed fresh in every
  session."
  **File**: `.opencode/commands/speckit.implement.md`

## 2. Harden commit/push gate (Gap B)

- [x] 2.1 Replace lines 142-143 (prose prompt to commit) with
  an AskUserQuestion tool call. Change "prompt the user to
  commit and push before proceeding" to: "Use the
  **AskUserQuestion tool** with options `['Yes -- all
  committed and pushed', 'Not yet -- let me commit first']`".
  Add response handling: if "Not yet", halt and remind user
  to commit/push; if "Yes", proceed to suggest next steps.
  **File**: `.opencode/commands/speckit.implement.md`

- [x] 2.2 Add a CRITICAL RULE block after the commit/push gate
  (after line 151) stating: "CRITICAL RULE: NEVER suggest
  next steps (PR creation, merging, branch switching,
  archiving) without an AskUserQuestion tool call response
  confirming changes are committed and pushed. This gate
  cannot be inherited from compressed or resumed session
  context — it MUST be executed fresh in every session."
  **File**: `.opencode/commands/speckit.implement.md`

## 3. Verification

- [x] 3.1 Verify the modified speckit.implement.md contains
  AskUserQuestion tool calls and CRITICAL RULE blocks at the
  expected locations. Verify no other sections of the file
  were unintentionally modified. Run the following commands
  to confirm:
  ```bash
  # Verify checklist gate section contains AskUserQuestion
  grep -n "AskUserQuestion" .opencode/commands/speckit.implement.md
  # Expected: matches in checklist gate section AND commit/push gate section

  # Verify CRITICAL RULE blocks exist near each gate
  grep -n "CRITICAL RULE" .opencode/commands/speckit.implement.md
  # Expected: 2 matches, one per gate section

  # Verify session-resume language is present
  grep -n "session context" .opencode/commands/speckit.implement.md
  # Expected: matches in both CRITICAL RULE blocks
  ```
  Structural check: each AskUserQuestion instruction MUST
  have a CRITICAL RULE block within 5 lines that includes
  session-resume guard language.
  **File**: `.opencode/commands/speckit.implement.md`

- [x] 3.2 Verify constitution alignment: confirm this change
  does not introduce inter-hero dependencies (Principle II),
  does not affect artifact formats (Principle I), and
  maintains observable gate enforcement (Principle III).
  Cross-reference with proposal.md constitution assessment.

  Note: the Guardrails section (lines 154-166) contains a
  pre-existing contradiction ("NEVER modify source code" in
  the implementation command). This is out of scope for this
  change — do not modify it.
<!-- spec-review: passed -->
<!-- code-review: passed -->
