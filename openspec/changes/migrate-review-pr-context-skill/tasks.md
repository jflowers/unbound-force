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

## 1. Migrate `/review-pr` to `review-context` skill

All tasks in this group modify the same file
(`.opencode/commands/review-pr.md`) — no parallel
execution.

- [x] 1.1 Replace Steps 6 and 6a (lines 253-317) with
  a new Step 6 that invokes the `review-context` skill
  via the `skill` tool, following the same invocation
  pattern as Step 4 (pre-flight). The new step MUST
  execute Protocols 1-4 and record the output for use
  in Step 8 and Step 9. Remove all inline spec
  discovery, issue linking, and sanitization logic.

- [x] 1.2 Replace the path-based focus heuristic table
  and walkthrough generation instructions in the Step 8
  preamble (lines 422-453) with a compact back-reference
  to the skill output from Step 6 (Protocols 3 and 4).
  Preserve the existing review deduplication logic
  (lines 403-420) and the note that Step 8b security
  review applies to ALL files regardless of heuristic.

- [x] 1.3 Update forward references:
  - Line 463: change `(Step 6a)` to
    `(Step 6, Protocol 2)`
  - Line 643: change `Step 6a` to `Step 6`

## 2. Update `/address-feedback` terminology

- [x] 2.1 [P] In `.opencode/commands/address-feedback.md`,
  replace line 143 ("If `review-context` convention pack
  exists, use it for standardized discovery. Otherwise
  inline the discovery logic above.") with: "Invoke the
  `skill` tool with name `review-context` to load
  standardized context discovery (spec artifacts, linked
  issues, path classification)."

## 3. Scaffold sync

These tasks mirror changes from groups 1 and 2 to
scaffold copies. Each touches a different scaffold file.

- [x] 3.1 [P] Copy the updated
  `.opencode/commands/review-pr.md` content to
  `internal/scaffold/assets/opencode/commands/review-pr.md`
  (must be byte-identical).

- [x] 3.2 [P] Copy the updated
  `.opencode/commands/address-feedback.md` content to
  `internal/scaffold/assets/opencode/commands/address-feedback.md`
  (must be byte-identical).

## 4. Verification

- [x] 4.1 Run `make test` — the drift detection test
  `TestEmbeddedAssets_MatchSource` MUST pass, confirming
  scaffold copies match live files.

- [x] 4.2 Verify constitution alignment: Composability
  First (II) — the skill invocation uses the standard
  `skill` tool pattern, maintaining independent
  usability. Testability (IV) — scaffold drift test
  provides automated verification. Security by Default
  (V) — sanitization controls are preserved in the
  skill's Protocol 2.

<!-- spec-review: passed -->
<!-- code-review: passed -->
