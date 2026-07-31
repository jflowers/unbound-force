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

  All tasks in groups 1-5 modify the same file:
  .opencode/commands/triage-issue.md
  Group 6 (scaffold sync) modifies a different file but
  depends on groups 1-4 completing first.
  Therefore NO tasks are parallel-eligible.
-->

## 1. Replace auto-apply policy and summary template

- [x] 1.1 In `.opencode/commands/triage-issue.md`, replace
  the auto-apply statement in Section 4.2 ("Labels are
  applied **automatically without user confirmation**, with
  one exception...") with text requiring AskUserQuestion
  confirmation for ALL label mutations. New text:

  "**All label mutations require user confirmation.**
  Before creating or applying any label, use the
  **AskUserQuestion tool** to obtain explicit confirmation."

- [x] 1.2 In Section 4.1 (Proposed Actions summary
  template), update the label display line from
  `• Label: <label> (auto-apply / requires confirmation)`
  to `• Label: <label> (requires confirmation)` since all
  labels now require confirmation.

## 2. Add label creation confirmation gate

- [x] 2.1 In `.opencode/commands/triage-issue.md`, before
  the `gh label create` block (line 262), add an
  AskUserQuestion gate:

  Before creating the label, present: "The label '<label>'
  does not exist in the repository." Use the
  **AskUserQuestion tool** with options
  `["Yes -- create and apply label '<label>'",
  "No -- skip"]`.

  If the user selects "No -- skip", skip both label
  creation and application. Record `labels_applied: []`
  and `label_creation_failed: false` in `actions_taken`.
  Proceed to Section 4.3.

## 3. Add label application confirmation gate

- [x] 3.1 In `.opencode/commands/triage-issue.md`, before
  the `gh issue edit --add-label` block (line 270), add
  an AskUserQuestion gate for cases where the label
  already exists:

  Use the **AskUserQuestion tool** with options
  `["Yes -- apply label '<label>'", "No -- skip"]`.

  If the user selects "No -- skip", skip label
  application. Record `labels_applied: []` in
  `actions_taken`. Proceed to Section 4.3.

## 4. Preserve duplicate supplementary gate and update Guardrail 1

- [x] 4.1 In `.opencode/commands/triage-issue.md`, verify
  that the existing `duplicate`-specific AskUserQuestion
  gate (in Section 4.2, after the apply block) remains
  intact as a supplementary gate. Update the surrounding
  text to clarify that the `duplicate` label receives both
  the general confirmation (from task 3.1) AND the
  supplementary close-semantics confirmation.

- [x] 4.2 In Guardrail 1 (Section 4.5), update the text
  from "The `duplicate` label is applied only with user
  confirmation" to "All labels are applied only with user
  confirmation" to match the new Section 4.2 policy.

## 5. Verification

- [x] 5.1 Read the modified `triage-issue.md` end-to-end
  through Sections 4.1, 4.2, and 4.5 and verify:
  - The string "automatically without user confirmation"
    does NOT appear in Section 4.2
  - The string "auto-apply" does NOT appear in Section 4.1
  - "AskUserQuestion" appears at least 3 times in
    Section 4.2 (general create gate, general apply gate,
    duplicate supplementary gate)
  - The duplicate supplementary gate is preserved
  - Re-run check (skip if label already applied) is
    preserved
  - Permission failure handling is preserved
  - The `actions_taken` recording pattern is consistent
  - Guardrail 1 says "All labels" not "The `duplicate`
    label"

- [x] 5.2 Verify constitution alignment against all five
  principles:
  - Principle I (Autonomous Collaboration): N/A
  - Principle II (Composability First): N/A
  - Principle III (Observable Quality): PASS -- all label
    mutations now produce an observable user-confirmed
    audit trail
  - Principle IV (Testability): N/A -- no Go source
    changes
  - Principle V (Security by Default): N/A -- no new
    dependencies or external inputs

## 6. Scaffold asset sync

- [x] 6.1 Copy the modified `.opencode/commands/triage-issue.md`
  to its scaffold asset location at
  `internal/scaffold/assets/opencode/commands/triage-issue.md`
  to maintain byte-identical sync.

- [x] 6.2 Run `go test ./internal/scaffold/... -race -count=1`
  to verify `TestEmbeddedAssets_MatchSource` passes.

<!-- spec-review: passed -->
<!-- code-review: passed -->
