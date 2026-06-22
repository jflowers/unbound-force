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

## 1. Convert /review-pr confirmations

All edits target `.opencode/commands/review-pr.md`.
No [P] markers -- single file, sequential edits.

- [x] 1.1 Convert pending CI checks prompt (line ~110).
  Replace "inform the user and ask whether to wait or
  proceed" with: Use the **AskUserQuestion tool** with
  options `["Wait for checks to complete", "Proceed
  with available results"]`.

- [x] 1.2 Convert large PR warning (lines ~236-238).
  Replace "warn the user and ask whether to review all
  files or focus on specific ones" with: Use the
  **AskUserQuestion tool** with options `["Review all
  files", "Focus on specific files"]` (custom input
  enabled for specifying which files).

- [x] 1.3 Convert GitHub review posting offer
  (lines ~697-704). Replace the conversational "Would
  you like me to post this as a GitHub review..." with:
  Use the **AskUserQuestion tool** with options
  `["Yes -- post as GitHub review", "No -- terminal
  summary is sufficient"]`.

- [x] 1.4 Convert duplicate review detection
  (lines ~717-731). Replace `(yes/no)` prompts with:
  - Same verdict: Use the **AskUserQuestion tool** with
    options `["Yes -- post new review", "No -- skip
    posting"]`.
  - Different verdict: Use the **AskUserQuestion tool**
    with options `["Yes -- override with <new_verdict>",
    "No -- keep existing <old_verdict>"]`.

- [x] 1.5 Convert verdict-aligned confirmation
  (lines ~824-840). Replace typed confirmations with:
  - APPROVE: Use the **AskUserQuestion tool** with
    options `["Approve -- post review", "No -- skip
    posting", "Edit comments first", "Change verdict"]`.
  - REQUEST CHANGES / COMMENT: Use the
    **AskUserQuestion tool** with options `["Yes --
    post review", "No -- skip posting", "Edit comments
    first", "Change verdict"]`.

- [x] 1.6 Convert fix-branch offer (lines ~598-606).
  Replace conversational "Would you like me to create
  a fix branch..." with: Use the **AskUserQuestion
  tool** with options `["Yes -- create fix branch",
  "No -- skip"]`.

- [x] 1.7 Update the critical rule (lines ~881-887).
  Replace "require the user to type 'approve'
  explicitly" with: "require the user to select the
  'Approve -- post review' option from the
  AskUserQuestion tool". Preserve the safety intent.

**Checkpoint**: Read the modified file end-to-end.
Verify all 6 interaction points plus the critical rule
reference the **AskUserQuestion tool**. Verify no
`(yes/no)` or `(approve/no/edit/change-verdict)`
patterns remain.

## 2. Convert /address-feedback confirmations

All edits target `.opencode/commands/address-feedback.md`.
No [P] markers -- single file, sequential edits.

- [x] 2.1 Convert per-item triage decision
  (lines ~239-250). Replace the implicit typed keyword
  mechanism with: Use the **AskUserQuestion tool** with
  options `["Accept", "Modify", "Reject", "Ask"]`. For
  MODIFY, follow up with the **AskUserQuestion tool**
  (open-ended, no preset options) to collect the
  alternative approach. For REJECT, follow up with
  the **AskUserQuestion tool** (open-ended) to collect
  evidence-based reasoning. For ASK, follow up with
  the **AskUserQuestion tool** (open-ended) to collect
  the clarification question.

- [x] 2.2 Convert triage summary confirmation
  (line ~270). Replace "The author MUST confirm before
  execution proceeds" with: Use the **AskUserQuestion
  tool** with options `["Confirm -- proceed with
  execution", "Revise -- change decisions"]`.

- [x] 2.3 Convert diverged branch handling
  (lines ~319-323). Replace the free-text options with:
  Use the **AskUserQuestion tool** with options
  `["Rebase onto remote and push", "Abort -- preserve
  local commits"]`.

- [x] 2.4 Convert comment posting confirmation
  (line ~336). Replace "All comment posting requires
  author confirmation" with: Use the **AskUserQuestion
  tool** with options `["Yes -- post reply comments",
  "No -- skip posting"]`.

- [x] 2.5 Convert thread resolution confirmation
  (line ~382). Replace "The author confirms before
  resolving" with: Use the **AskUserQuestion tool**
  with options `["Yes -- resolve accepted threads",
  "No -- leave threads open"]`.

**Checkpoint**: Read the modified file end-to-end.
Verify all 5 interaction points reference the
**AskUserQuestion tool**. Verify no bare `confirm`
or implicit typed-input patterns remain.

## 3. Convert /triage-issue confirmations

All edits target `.opencode/commands/triage-issue.md`.
No [P] markers -- single file, sequential edits.

- [x] 3.1 Convert duplicate label confirmation
  (lines ~273-274). Replace `Confirm? (yes/no)` with:
  Use the **AskUserQuestion tool** with options
  `["Yes -- apply duplicate label", "No -- skip"]`.

- [x] 3.2 Convert re-run triage comment warning
  (lines ~293-294). Replace "Proceed?" with: Use the
  **AskUserQuestion tool** with options `["Yes -- post
  another comment", "No -- skip comment"]`.

- [x] 3.3 Convert comment posting decision
  (lines ~296-303). Replace the APPROVE/MODIFY/ABORT
  choices with: Use the **AskUserQuestion tool** with
  options `["Approve -- post as-is", "Modify -- adjust
  comment text", "Abort -- do not post"]`. For MODIFY,
  follow up with the **AskUserQuestion tool**
  (open-ended) to collect adjusted comment text.

- [x] 3.4 Convert child issue creation confirmations
  (lines ~330-340). Replace per-child confirmation with:
  Use the **AskUserQuestion tool** with options
  `["Yes -- create this child issue", "No -- skip"]`.
  For duplicate child warning, use: `["Yes -- create
  anyway", "No -- skip this child issue"]`.

**Checkpoint**: Read the modified file end-to-end.
Verify all 4 interaction points reference the
**AskUserQuestion tool**. Verify no `(yes/no)` or
implicit typed-input patterns remain.

## 4. Sync scaffold assets

Each command file has a byte-identical copy under
`internal/scaffold/assets/opencode/commands/`. These
MUST be synced after all command edits are complete.

- [x] 4.1 [P] Copy `.opencode/commands/review-pr.md` to
  `internal/scaffold/assets/opencode/commands/review-pr.md`
  (byte-identical).

- [x] 4.2 [P] Copy `.opencode/commands/address-feedback.md`
  to `internal/scaffold/assets/opencode/commands/address-feedback.md`
  (byte-identical).

- [x] 4.3 [P] Copy `.opencode/commands/triage-issue.md` to
  `internal/scaffold/assets/opencode/commands/triage-issue.md`
  (byte-identical).

**Checkpoint**: Run `go test ./internal/scaffold/... -count=1`.
`TestEmbeddedAssets_MatchSource` MUST pass.

## 5. Verification

- [x] 5.1 Run `go test -race -count=1 ./...` to verify
  no test regressions.

- [x] 5.2 Verify constitution alignment: confirm no
  artifact formats, hero interfaces, or machine-parseable
  outputs were modified. Only instruction text in
  markdown files was changed.
<!-- scaffolded by uf vdev -->
