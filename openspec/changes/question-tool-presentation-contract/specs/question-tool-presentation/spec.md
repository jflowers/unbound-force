## ADDED Requirements

### Requirement: FR-001 Visibility directive at every gate

Every question-tool invocation in `/uf.triage-issue`,
`/uf.address-feedback`, and `/uf.review-pr` MUST print its
decision content as plain session text above the question
tool, and the printed text and the question tool MUST present
the same details and options.

Previously: gates used the weaker "Inform the user …" or bare
options-list shape, with no print-above guarantee for composed
content.

#### Scenario: Composed reply comments printed before posting
question

- **GIVEN** `/uf.address-feedback` Section 4.5 has composed
  reply comments
- **WHEN** the posting question is presented
- **THEN** the full composed replies MUST be printed as plain
  session text above the question tool
- **AND** the printed text and the question tool MUST present
  the same details and options

#### Scenario: Composed triage comment printed before
confirmation

- **GIVEN** `/uf.triage-issue` Section 4.3 has composed a
  triage comment
- **WHEN** the comment confirmation question is presented
- **THEN** the full composed comment MUST be printed as plain
  session text above the question tool
- **AND** the printed text and the question tool MUST present
  the same details and options

#### Scenario: Required summary printed above a main gate

- **GIVEN** a command reaches a gate with a required summary
  display (`/uf.triage-issue` Phase 4.1 summary,
  `/uf.address-feedback` Phase 4 execution summary,
  `/uf.review-pr` Step 7 failure context or Step 7.5 commit
  preview)
- **WHEN** the gate question is presented
- **THEN** the required summary MUST be printed as plain
  session text above the question tool
- **AND** the printed summary and the question tool MUST
  present the same details and options

### Requirement: FR-002 Per-option reasoning in printed text

The session text printed above every question-tool invocation
MUST include per-option reasoning: what each choice does and
when it fits the current decision.

#### Scenario: Bare options list replaced

- **GIVEN** a gate previously presented only an options list
  (e.g., `/uf.triage-issue` Section 4.2 label gates,
  `/uf.review-pr` Step 3 CI-pending gate)
- **WHEN** the upgraded gate is presented
- **THEN** the printed session text MUST explain what each
  option does and when it fits

#### Scenario: Existing per-option bullets bound to printed
text

- **GIVEN** a gate whose option semantics were described in
  bullets without a printed-text guarantee
  (`/uf.address-feedback` Phase 4 execution gate,
  `/uf.review-pr` Step 7.5 commit gate)
- **WHEN** the upgraded gate is presented
- **THEN** the per-option reasoning MUST appear in the printed
  session text above the question tool

### Requirement: FR-003 Advisory recommendation, justified

The session text printed above every question-tool invocation
MUST include a recommendation with its justification, and
MUST identify the recommendation as advisory — the human
decides.

#### Scenario: Recommendation present at every gate

- **GIVEN** any question-tool invocation in the three commands
- **WHEN** the gate is presented
- **THEN** the printed session text MUST state a recommended
  option and justify it
- **AND** the printed text MUST identify the recommendation as
  advisory (the human decides)

#### Scenario: Author-decides flows label the recommendation
non-binding

- **GIVEN** `/uf.address-feedback` Section 3.2 presents a
  per-item decision whose assessment recommendation is
  `AUTHOR-DECIDES`
- **WHEN** the gate is presented
- **THEN** the printed recommendation MUST be the command's
  advisory suggestion, clearly labeled non-binding
- **AND** the suggestion MUST NOT be presented as the panel's
  or a reviewer's binding verdict

### Requirement: FR-004 Recommended-first question presentation

Every question-tool invocation MUST present the question tool
below the printed text with the same options, the recommended
option FIRST and labeled "(Recommended)".

#### Scenario: Recommended option ordered first and labeled

- **GIVEN** any question-tool invocation in the three commands
  whose printed recommendation names option X
- **WHEN** the question tool is presented
- **THEN** option X MUST appear first in the option list
- **AND** option X's label MUST end with "(Recommended)"

#### Scenario: Option sets unchanged

- **GIVEN** any upgraded gate
- **WHEN** the question tool is presented
- **THEN** the option set MUST match the pre-upgrade option set
  for that gate, with only ordering and the "(Recommended)"
  label added

#### Scenario: Conditional recommendations and static arrays

- **GIVEN** a gate whose recommendation basis is conditional
  (design.md D2 recommendation-basis table)
- **WHEN** the question tool is presented
- **THEN** the literal option array enumerates the option set,
  and the recommended-first directive governs presentation
  order and "(Recommended)" labeling at runtime
- **AND** at gates with an unconditional recommendation, the
  literal option array MUST lead with the recommended option

### Requirement: FR-005 Open-ended follow-ups preserved

Open-ended follow-up questions MUST keep their open-ended form
(no preset options); only the surrounding presentation changes.

#### Scenario: Modify/Reject/Ask follow-ups stay open-ended

- **GIVEN** the author selects "Modify", "Reject", or "Ask" at
  the `/uf.address-feedback` Section 3.2 per-item gate
- **WHEN** the command collects the alternative approach,
  rejection reasoning, or clarification question
- **THEN** the follow-up MUST use the question tool open-ended,
  no preset options

#### Scenario: Diff-focus file selection stays open-ended

- **GIVEN** the user selects "Focus on specific files" at the
  `/uf.review-pr` Step 3.5 diff-size gate
- **WHEN** the command collects the files or directories to
  focus on
- **THEN** the follow-up MUST use the question tool open-ended,
  no preset options

#### Scenario: Triage comment Modify follow-up stays open-ended

- **GIVEN** the user selects "Modify -- adjust comment text" at
  the `/uf.triage-issue` Section 4.3 comment gate
- **WHEN** the command collects the adjusted comment text
- **THEN** the follow-up MUST use the question tool open-ended,
  no preset options

### Requirement: FR-006 Recommendation derivation

A gate's printed recommendation MUST be the command's advisory
suggestion derived from its own assessment data for that
decision (panel verdict and dissent, item classification and
evidence, reviewer authority, CI classification, composed
content, or execution plan). The command MUST NOT fabricate a
recommendation it cannot ground in that data.

#### Scenario: Triage mutation gate recommendation

- **GIVEN** `/uf.triage-issue` Phase 4 gate with a decisive
  panel majority and proposed actions that follow from the
  classification
- **WHEN** the gate is presented
- **THEN** the printed recommendation MUST be "Proceed --
  execute triage actions" with the majority and action basis
  cited as justification

#### Scenario: Duplicate review detection recommendation

- **GIVEN** `/uf.review-pr` Step 8a finds a prior review with
  the same verdict as the new review
- **WHEN** the gate is presented
- **THEN** the printed recommendation MUST be "No -- skip
  posting" with the duplicate-noise rationale, advisory only

#### Scenario: Author-decides item recommendation

- **GIVEN** `/uf.address-feedback` Section 3.2 presents an item
  whose assessment recommendation is `ACCEPT`
- **WHEN** the gate is presented
- **THEN** the printed recommendation MUST be "Accept" with
  the evidence and authority basis cited

#### Scenario: Ungroundable recommendation is fail-closed

- **GIVEN** assessment data that genuinely favors no option
- **WHEN** the gate is presented
- **THEN** the printed recommendation MUST say so and present
  the trade-off
- **AND** the question MUST still be presented with its full
  option set

### Requirement: FR-007 uf.triage-issue gate inventory

`/uf.triage-issue` MUST apply the presentation contract (FR-001
through FR-006) at each of its eight question-tool invocations,
with the option sets below.

#### Scenario: Phase 4 mutation gate

- **GIVEN** `/uf.triage-issue` reaches the Phase 4 mutation
  gate
- **WHEN** the gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Proceed -- execute triage actions", "Skip -- write
  artifact only"]`
- **AND** the MANDATORY GATE markers, session-resume guard,
  and the Section 4.1 summary-before-gate requirement MUST be
  preserved

#### Scenario: Section 4.2 Path A gate (label does not exist)

- **GIVEN** the Section 4.2 target label does not exist in the
  repository
- **WHEN** the gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Yes -- create and apply label '<label>'", "No -- skip"]`

#### Scenario: Section 4.2 Path B gate (label exists)

- **GIVEN** the Section 4.2 target label already exists in the
  repository
- **WHEN** the gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Yes -- apply label '<label>'", "No -- skip"]`

#### Scenario: Section 4.2 duplicate supplementary gate

- **GIVEN** the target label is `duplicate`
- **WHEN** the supplementary gate is presented after the Path A
  or Path B confirmation
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Yes -- apply duplicate label", "No -- skip"]`
- **AND** the printed text MUST retain the warning that the
  `duplicate` label signals the issue should be closed

#### Scenario: Section 4.3 re-run comment check

- **GIVEN** a previous triage comment was detected in Phase 1.2
- **WHEN** the re-run gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["No -- skip comment", "Yes -- post another comment"]`

#### Scenario: Section 4.3 comment confirmation gate

- **GIVEN** `/uf.triage-issue` has composed a triage comment
- **WHEN** the confirmation gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Approve -- post as-is", "Modify -- adjust comment text",
  "Abort -- do not post"]`

#### Scenario: Section 4.4 per-child-issue creation gate

- **GIVEN** Phase 3.5 produced split recommendations
- **WHEN** each proposed child issue is presented
- **THEN** the per-child gate MUST satisfy FR-001 through
  FR-006 with options `["Yes -- create this child issue",
  "No -- skip"]`

#### Scenario: Section 4.4 child duplicate check

- **GIVEN** the Section 4.4 duplicate search found a close
  match for a proposed child issue
- **WHEN** the warning gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["No -- skip this child issue", "Yes -- create anyway"]`

### Requirement: FR-008 uf.address-feedback gate inventory

`/uf.address-feedback` MUST apply the presentation contract
(FR-001 through FR-006) at each of its six question-tool
invocations, with the option sets below.

#### Scenario: Section 3.2 per-item author decision gate

- **GIVEN** `/uf.address-feedback` presents a feedback item for
  decision
- **WHEN** the gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Accept", "Modify", "Reject", "Ask"]`
- **AND** the Section 3.1 item display (classification,
  evidence, thread, suggested approach) MUST be printed as
  session text above the question tool

#### Scenario: Section 3.4 triage summary confirmation gate

- **GIVEN** all feedback items have recorded decisions
- **WHEN** the summary confirmation gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Confirm -- proceed with execution", "Revise -- change
  decisions"]`

#### Scenario: Phase 4 execution gate

- **GIVEN** `/uf.address-feedback` reaches the Phase 4
  execution gate
- **WHEN** the gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Proceed with Phase 4 execution", "Review plan again",
  "Abort -- stop here"]`
- **AND** the MANDATORY GATE markers, session-resume guard,
  execution summary, and CRITICAL RULE MUST be preserved

#### Scenario: Section 4.4 diverged-branch rebase gate

- **GIVEN** the remote branch has diverged from the local
  branch
- **WHEN** the rebase gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Rebase onto remote and push", "Abort -- preserve local
  commits"]`

#### Scenario: Section 4.5 post reply comments gate

- **GIVEN** reply comments have been composed for decided items
- **WHEN** the posting gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Yes -- post reply comments", "No -- skip posting"]`

#### Scenario: Section 4.6 resolve threads gate

- **GIVEN** reply comments were posted for accepted items
- **WHEN** the thread-resolution gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Yes -- resolve accepted threads", "No -- leave threads
  open"]`

### Requirement: FR-009 uf.review-pr gate inventory

`/uf.review-pr` MUST apply the presentation contract (FR-001
through FR-006) at each of its eight question-tool invocations,
with the option sets below.

#### Scenario: Step 3 CI checks pending gate

- **GIVEN** `/uf.review-pr` finds CI checks still PENDING
- **WHEN** the gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Wait for checks to complete", "Proceed with available
  results"]`

#### Scenario: Step 3.5 diff size advisory gate

- **GIVEN** total diff lines exceed 2000 or changed files
  exceed 50
- **WHEN** the scope gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Review all files", "Focus on specific files"]`

#### Scenario: Step 7 fix-branch offer gate

- **GIVEN** Step 3a identified pre-existing CI failures
- **WHEN** the fix-branch offer is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Yes -- create fix branch", "No -- skip"]`

#### Scenario: Step 7.5 fix-branch commit gate

- **GIVEN** a fix branch has staged changes and a proposed
  commit message
- **WHEN** the commit gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Commit -- apply fix", "Edit commit message", "Abort --
  discard changes"]`
- **AND** the MANDATORY GATE markers, session-resume guard,
  commit preview, and CRITICAL RULE MUST be preserved

#### Scenario: Step 8 review-posting offer gate

- **GIVEN** the terminal review summary has been presented
- **WHEN** the posting offer is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Yes -- post as GitHub review", "No -- terminal summary is
  sufficient"]`

#### Scenario: Step 8a duplicate detection, same verdict

- **GIVEN** a prior review exists with the same verdict as the
  new review
- **WHEN** the gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["No -- skip posting", "Yes -- post new review"]`

#### Scenario: Step 8a duplicate detection, different verdict

- **GIVEN** a prior review exists with a different verdict
  from the new review
- **WHEN** the gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Yes -- override with <new_verdict>", "No -- keep existing
  <old_verdict>"]`

#### Scenario: Step 8c verdict posting gate

- **GIVEN** the verdict has been mapped to a GitHub event type
- **WHEN** the posting gate is presented
- **THEN** it MUST satisfy FR-001 through FR-006 with options
  `["Approve -- post review", "No -- skip posting", "Edit
  comments first", "Change verdict"]` for APPROVE verdicts, or
  `["Yes -- post review", "No -- skip posting", "Edit comments
  first", "Change verdict"]` for REQUEST CHANGES or COMMENT
  verdicts
- **AND** the MANDATORY GATE markers, session-resume guard,
  verdict mapping table, and VISIBILITY DIRECTIVE MUST be
  preserved

### Requirement: FR-010 Structural pin tests

The presentation contract MUST be enforced by structural pin
tests in `internal/scaffold/scaffold_test.go` that read the
three embedded command assets and fail `make check` on drift.

Previously: #792's advisories noted the presentation contract
is pinned only in prose, not in tests.

#### Scenario: Shared contract fragments pinned

- **GIVEN** the three command assets carry the presentation
  contract at every gate
- **WHEN** the pin test runs
- **THEN** each asset MUST be asserted to contain the shared
  contract fragments: the visibility-directive same-details
  clause, the per-option-reasoning clause, the advisory
  recommendation clause, and the recommended-first
  "(Recommended)" labeling

#### Scenario: Gate option inventories pinned

- **GIVEN** the FR-007, FR-008, and FR-009 gate inventories
- **WHEN** the pin test runs
- **THEN** every option label in those inventories MUST be
  asserted present in its command asset

#### Scenario: Per-gate fragment counts pinned

- **GIVEN** the per-command gate counts (8 for
  `/uf.triage-issue`, 6 for `/uf.address-feedback`, 8 for
  `/uf.review-pr`)
- **WHEN** the pin test runs
- **THEN** every shared contract fragment MUST be counted in
  each asset and equal the recorded gate count (each fragment
  appears exactly once per gate), so a removed gate, or a gate
  missing any contract element, fails the test

#### Scenario: Option-array literal tripwire pinned

- **GIVEN** the per-command backtick-bracket option-array
  literal counts (8 for `/uf.triage-issue`, 6 for
  `/uf.address-feedback`, 9 for `/uf.review-pr`, whose Step 8c
  carries two verdict-specific option sets)
- **WHEN** the pin test runs
- **THEN** the count of option-array openers (`["` preceded by
  a backtick; embedded JSON examples carry no backtick and are
  not counted) MUST equal the recorded count in each asset, so
  a gate added in the house style raises the count and fails
  the test

#### Scenario: Legacy bare-options phrasing absent

- **GIVEN** the pre-upgrade gates led with the instruction
  `Use the **question tool** with options` instead of printing
  decision content above the question tool
- **WHEN** the pin test runs
- **THEN** that legacy phrase MUST be absent from all three
  command assets, so a gate added in the legacy shape fails
  the test

#### Scenario: Pin test fails on contract drift

- **GIVEN** the three command assets carry the presentation
  contract at every gate
- **WHEN** a gate's contract fragment or option label is
  removed or drifts, a fragment's per-gate count changes, a
  backtick-bracket option array is added or removed, an
  option label's pinned occurrence total changes, or the
  legacy bare-options phrasing reappears in any command asset
- **THEN** the pin test MUST fail under
  `go test ./internal/scaffold/...`
- **AND** a gate added in neither the house style (backtick
  option array) nor the pinned legacy phrasing is outside the
  pin test's mechanical detection and relies on review. The
  fail-closed clause is carried by every gate but not
  fragment-pinned; its deletion relies on review. A
  non-inventory option label added inside an existing
  house-style array is likewise outside the pin surface and
  relies on review.

### Requirement: FR-011 Scaffold asset synchronization

After modifying any command file under `.opencode/commands/`,
the corresponding scaffold asset under
`internal/scaffold/assets/opencode/commands/` MUST be updated
to remain byte-identical.

#### Scenario: Scaffold drift detection

- **GIVEN** the three command files have been modified
- **WHEN** `go test ./internal/scaffold/...` runs
- **THEN** the existing drift detection test MUST pass,
  confirming each scaffold asset matches its canonical source

### Requirement: FR-012 Safety semantics preserved

The presentation upgrade MUST NOT weaken any existing safety
gate: blocking rules, session-resume guards, MANDATORY GATE
markers, CRITICAL RULES, and option sets MUST be preserved, and
no guarded mutation may execute without an explicit human
question-tool choice.

#### Scenario: No mutation without an explicit choice

- **GIVEN** any upgraded gate that guards a mutation
- **WHEN** the gate is presented
- **THEN** the guarded mutation MUST NOT execute until the
  human selects a confirming option
- **AND** every pre-upgrade escape option (skip, abort, edit,
  revise) MUST remain present

#### Scenario: Contract failure is fail-closed

- **GIVEN** a gate where the command cannot ground a
  recommendation or print the required decision content
- **WHEN** the gate would be presented
- **THEN** the command MUST NOT skip the question or narrow
  the options; it MUST present what it can and state what is
  unavailable
