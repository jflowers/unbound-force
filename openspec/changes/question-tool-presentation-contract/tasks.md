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

## 1. Upgrade uf.triage-issue gates

All edits target `.opencode/commands/uf.triage-issue.md`.
No [P] markers — single file, sequential edits. Apply the
canonical contract block (design.md D2) at each gate; preserve
gate safety semantics per FR-012.

- [x] 1.1 Upgrade the Phase 4 mutation gate (~L469-505): keep
  the MANDATORY GATE markers, session-resume guard, and the
  4.1-summary-before-gate requirement; bind the printed summary
  to the question options with the visibility directive
  same-details clause; add per-option reasoning for "Proceed --
  execute triage actions" and "Skip -- write artifact only";
  add the recommendation (proceed on decisive majority, skip on
  material dissent) with justification; order the recommended
  option first, labeled "(Recommended)".

- [x] 1.2 Upgrade Section 4.2 label gates: Path A (label does
  not exist), Path B (label exists), and the `duplicate`
  supplementary gate. Each gains the contract block; the
  duplicate gate retains its close-semantics warning in the
  printed text. Recommendation basis per design.md D2 table.

- [x] 1.3 Upgrade Section 4.3: the re-run comment check and
  the comment confirmation gate. The composed comment MUST be
  printed as plain session text above the question (FR-001);
  the Modify follow-up stays open-ended; recommendation basis
  per design.md D2 table.

- [x] 1.4 Upgrade Section 4.4: the per-child-issue creation
  gate and the child duplicate check. Title and body remain
  printed above the question; recommendation basis per
  design.md D2 table.

- [x] 1.5 Checkpoint: read the modified file end-to-end.
  Verify all 8 gates carry the contract block (8 occurrences
  of "Per-option reasoning:"), option sets are unchanged, and
  no MANDATORY GATE marker, session-resume guard, or guardrail
  was weakened.

## 2. Upgrade uf.address-feedback gates

All edits target `.opencode/commands/uf.address-feedback.md`.
No [P] markers — single file, sequential edits.

- [x] 2.1 Upgrade Section 3.2 per-item author decision: the
  3.1 item display is the printed decision content; add
  per-option reasoning for Accept/Modify/Reject/Ask and the
  recommendation (ACCEPT assessment -> "Accept";
  AUTHOR-DECIDES -> advisory suggestion clearly labeled
  non-binding). The Modify/Reject/Ask follow-ups stay
  open-ended.

- [x] 2.2 Upgrade Section 3.4 triage summary confirmation:
  the summary display binds to the question options; add
  per-option reasoning and the recommendation.

- [x] 2.3 Upgrade the Phase 4 execution gate: keep the
  MANDATORY GATE markers, session-resume guard, execution
  summary, and CRITICAL RULE; fold the existing per-option
  bullets into the printed text; add the recommendation and
  "(Recommended)"-first ordering.

- [x] 2.4 Upgrade Section 4.4 (diverged-branch rebase),
  Section 4.5 (post reply comments), and Section 4.6 (resolve
  threads). Section 4.5 MUST print the full composed replies
  as plain session text above the posting question (FR-001);
  recommendation basis per design.md D2 table.

- [x] 2.5 Checkpoint: read the modified file end-to-end.
  Verify all 6 gates carry the contract block (6 occurrences
  of "Per-option reasoning:"), option sets are unchanged, and
  all MANDATORY GATE markers and guards are intact.

## 3. Upgrade uf.review-pr gates

All edits target `.opencode/commands/uf.review-pr.md`. No [P]
markers — single file, sequential edits.

- [x] 3.1 Upgrade Step 3 (CI checks pending) and Step 3.5
  (diff size advisory): print the pending-check list / diff
  stats as decision context above the question; add per-option
  reasoning and the recommendation (Wait / Review all files as
  the conservative defaults per design.md D2). The Step 3.5
  focus-files follow-up stays open-ended.

- [x] 3.2 Upgrade Step 7 (fix-branch offer): keep the printed
  pre-existing-failure context as decision content; add
  per-option reasoning and the recommendation.

- [x] 3.3 Upgrade Step 7.5 (commit gate): keep the MANDATORY
  GATE markers, session-resume guard, commit preview, and
  CRITICAL RULE; fold the existing per-option bullets into the
  printed text; add the recommendation ("Commit -- apply fix"
  when the staged diff matches the failing check) and
  "(Recommended)"-first ordering.

- [x] 3.4 Upgrade Step 8 (review-posting offer), Step 8a
  (duplicate detection, same-verdict and different-verdict
  branches), and Step 8c (verdict posting gate). Step 8c keeps
  its VISIBILITY DIRECTIVE label, session-resume guard, and
  verdict mapping table, and gains per-option reasoning, the
  recommendation, and "(Recommended)"-first ordering for both
  verdict-specific option sets.

- [x] 3.5 Checkpoint: read the modified file end-to-end.
  Verify all 8 gates carry the contract block (8 occurrences
  of "Per-option reasoning:"), option sets are unchanged, and
  all MANDATORY GATE markers and guards are intact.

## 4. Sync scaffold assets

Each command file has a byte-identical copy under
`internal/scaffold/assets/opencode/commands/`. These MUST be
synced after all command edits are complete.

- [x] 4.1 [P] Copy `.opencode/commands/uf.triage-issue.md` to
  `internal/scaffold/assets/opencode/commands/uf.triage-issue.md`
  (byte-identical).

- [x] 4.2 [P] Copy `.opencode/commands/uf.address-feedback.md`
  to
  `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
  (byte-identical).

- [x] 4.3 [P] Copy `.opencode/commands/uf.review-pr.md` to
  `internal/scaffold/assets/opencode/commands/uf.review-pr.md`
  (byte-identical).

- [x] 4.4 Checkpoint: run `go test ./internal/scaffold/...
  -count=1`. The existing drift detection test MUST pass.

## 5. Extend structural pin tests

Edits target `internal/scaffold/scaffold_test.go` (design.md
D4). Follow the `TestSpecReviewPerFindingGateContracts`
pattern: standard library only, `t.Errorf`/`t.Fatalf`
directly, `assetContent` reads, no shared state.

- [x] 5.1 Add a new pin test (e.g.
  `TestQuestionToolPresentationContractGates`) with subtests:
  (a) shared contract fragments present in all three embedded
  command assets — `the question tool MUST present the`,
  `same details and options`, `Per-option reasoning: what each
  choice does and`, `when it fits`, `advisory only`,
  `the human decides`, `recommended option FIRST`,
  `labeled "(Recommended)"`; (b) every option label from the
  FR-007/FR-008/FR-009 inventories present in its command
  asset; (c) `strings.Count` of `Per-option reasoning:`
  equals 8 (triage-issue), 6 (address-feedback), 8
  (review-pr).

- [x] 5.2 Verify the pin test fails when a fragment is
  removed (temporarily delete one occurrence, run the test,
  confirm failure, restore).

- [x] 5.3 Checkpoint: run `go test ./internal/scaffold/...
  -race -count=1`. The new pin test and all existing scaffold
  tests MUST pass.

## 6. Verification

- [x] 6.1 Run `make check` (vet, lint, test, coverage gate,
  plugin tests). All checks MUST pass.

- [x] 6.2 Verify constitution alignment per proposal.md: no
  artifact formats, hero interfaces, machine-parseable
  outputs, or gate values were modified — only command prose,
  scaffold mirrors, and one new test. Confirm no gate was
  weakened (FR-012): re-read each MANDATORY GATE, CRITICAL
  RULE, and session-resume guard in the three commands.

- [x] 6.3 File the website documentation issue in
  `unbound-force/website` (design.md D5): what changed at the
  decision gates in `/uf.triage-issue`, `/uf.address-feedback`,
  `/uf.review-pr`, why it matters, which pages need updating.
  Record the issue number for the PR description. Filed:
  unbound-force/website#339 and unbound-force#853 (repo-local
  docs tracking).

- [x] 6.4 Add the change entry to `CHANGELOG.md` under
  `## Unreleased` in the established format: a
  `- question-tool-presentation-contract: <summary>` line
  plus `(Spec: openspec/changes/question-tool-presentation-contract/)`
  and `(Docs: <website issue from 6.3>)` reference lines.
