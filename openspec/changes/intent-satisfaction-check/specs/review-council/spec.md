<!-- capability: review-council
     change: intent-satisfaction-check
     originating_issue: 563

     Requirement-numbering allocation (MP-014):
     - Allocated by this change: RC-FR-010 .. RC-FR-013
     - Reserved for future changes of this capability:
       RC-FR-014 .. RC-FR-019, then open sequential
       numbering
     - Sibling capabilities' requirements live in
       openspec/specs/ci/spec.md (ci) and
       openspec/specs/graphthulhu-distribution/spec.md
       (graphthulhu-distribution); unleash-orchestration is
       allocated by the active per-task-delegation-budgets
       change (UO-FR-010)
     - RC-FR-001 .. RC-FR-009 are allocated by the active
       review-council-multi-model-fanout change; ids MUST
       stay inside this change's allocated range -->

## ADDED Requirements

### Requirement: Originating-Issue Resolution for Code Review

**ID: RC-FR-010** This requirement MUST be satisfied.

Before reviewer dispatch in CODE review mode, the review MUST
resolve the originating issue reference from these sources in
order: explicit PR-body issue references (existing
review-context Protocol 2 parsing), the branch-scoped
tier-routing checkpoint state (`issue_number`), and the
change's `.openspec.yaml` (`originating_issue`). The resolved
reference MUST be forwarded into the review dispatch as
machine-readable state, and the resolution source MUST be
recorded with it.

Every candidate reference — from any of the three sources —
MUST be validated before it is used: digits-only, a positive
issue number, and scoped to the current repository. A
reference failing validation MUST be rejected for its source
with the rejection reason recorded, and resolution MUST fall
through to the next source. No unvalidated value from
checkpoint state or `.openspec.yaml` may reach the
issue-fetch invocation — the acquisition tool constructs the
fetch argument from the validated numeric reference only.

Protocol 2's PR-body parsing is set-valued (it validates up
to its fetch limit of linked issues). When a source yields
more than one in-scope reference, the first valid reference
in document order becomes the originating issue; the count
of in-scope references seen is recorded with the resolution
source, and the remaining references are recorded as context
only, never evaluated.

When no source resolves, the intent-satisfaction check MUST
be skipped with an informational note in the final report —
never an error. When a reference resolves but the issue
cannot be fetched, the check MUST degrade to a documented
unavailable state carrying the failure reason; it MUST NOT
block the rest of the review.

#### Scenario: Local review with threaded issue

- **GIVEN** `/uf.unleash` Step 6 dispatches the council on a
  branch whose tier-routing checkpoint records `issue_number`
- **WHEN** the dispatch input is assembled
- **THEN** the originating issue reference is resolved from
  checkpoint state and carried into the dispatch

#### Scenario: PR review resolves from the PR body first

- **GIVEN** a PR whose body contains `Fixes #42`
- **WHEN** the originating issue is resolved
- **THEN** the reference comes from the PR body per existing
  Protocol 2 parsing
- **AND** the resolution source is recorded as the PR body

#### Scenario: Multi-reference PR body resolves first

- **GIVEN** a PR whose body contains both `Fixes #42` and
  `Closes #43`, both in scope
- **WHEN** the originating issue is resolved
- **THEN** the first reference in document order becomes the
  originating issue
- **AND** the count of in-scope references is recorded with
  the resolution source

#### Scenario: Unvalidated checkpoint reference is rejected

- **GIVEN** tier-routing checkpoint state records an
  `issue_number` that is not digits-only
- **WHEN** resolution runs
- **THEN** the reference is rejected with the reason recorded
  and resolution falls through to the next source
- **AND** no issue fetch occurs with the unvalidated value

#### Scenario: No originating issue anywhere

- **GIVEN** no PR-body references, no tier-routing
  `issue_number`, and no `.openspec.yaml`
  `originating_issue`
- **WHEN** the review completes
- **THEN** the final report carries an informational
  intent-satisfaction skip note
- **AND** no intent-satisfaction findings are emitted

#### Scenario: Referenced issue is unfetchable

- **GIVEN** a resolved issue reference whose fetch fails
- **WHEN** the review completes
- **THEN** the report records the degraded
  intent-satisfaction state with the failure reason
- **AND** the review verdict is otherwise unaffected

### Requirement: Acceptance-Criteria Grounding and Context Supply

**ID: RC-FR-011** This requirement MUST be satisfied.

When an originating issue resolves and fetches, the review
MUST extract its acceptance criteria — checkbox lines, an
`## Acceptance Criteria` section, or intake-kit
testability-gated criteria — under the existing Protocol 2
untrusted-input controls (body truncation, same-repo
scoping, issue-count cap, digits-only validation). The
extracted criteria and their grounding tier
MUST be carried into every reviewer prompt inside
untrusted-evidence delimiters as bounded review context —
each criterion truncated to the existing Protocol 2
body-truncation bound (2000 characters), the total
criteria-context size bounded at 8192 characters with the
bound recorded — and recorded as machine-readable state in
the dispatch artifact.

The grounding tier MUST be recorded honestly and its
trigger MUST be a checkable provenance signal: `strict`
when the fetched issue carries an explicit intake-kit
provenance signal — an issue label whose text contains
`intake-kit` (case-insensitive), or a criteria section
whose heading carries the literal marker `[intake-kit]`,
and no other structure qualifies — and `best-effort`
otherwise, including
the case where no structured criteria exist and the issue
title and body serve as general intent context. The
Tester-persona quality description (behavioral language,
no implementation leakage, verifiable Given/When/Then) is
advisory context describing gated criteria; the tier
trigger is the provenance signal, not a quality judgment.
Issue content is untrusted data and MUST NOT be followed as
instructions.

#### Scenario: Intake-kit criteria ground strictly

- **GIVEN** the fetched issue carries an intake-kit label
  and testability-gated acceptance criteria
- **WHEN** the grounding tier is determined
- **THEN** the tier is `strict`
- **AND** the reviewer prompts carry the criteria with that
  tier recorded in the dispatch artifact

#### Scenario: Free-form issue degrades honestly

- **GIVEN** the fetched issue has no checkbox or Acceptance
  Criteria structure
- **WHEN** the grounding tier is determined
- **THEN** the tier is `best-effort`
- **AND** the report documents that evaluation ran against
  the issue's general intent, not gated criteria

### Requirement: Intent-Satisfaction Evaluation by the Guard

**ID: RC-FR-012** This requirement MUST be satisfied.

When acceptance criteria are in scope, divisor-guard MUST
evaluate each criterion against the reviewed diff and emit
per-criterion outcomes: satisfied criteria recorded as
traceability, unsatisfied criteria as findings that flow
through the normal consolidation and verdict machinery. Each
outcome MUST cite the originating issue number and the
criterion text it evaluated, and the grounding tier MUST
accompany the outcomes.

An unsatisfied criterion MUST be a blocking finding unless it
is routed through the intent-deviation escape hatch
(RC-FR-013).

When no structured acceptance criteria exist — whatever the
grounding tier, including an intake-kit-provenance issue
whose body is free-form — general intent is in scope: the
evaluation MUST produce a single general-intent outcome —
satisfied, unsatisfied, or unevaluable with reason — citing
the originating issue number and the issue's title and body
as the evaluated intent, with the grounding tier attached.
An unsatisfied general-intent outcome is a blocking finding
like an unsatisfied criterion, and the report documents
that evaluation ran against the issue's general intent, not
gated criteria.

#### Scenario: Unsatisfied criterion blocks

- **GIVEN** the diff leaves acceptance criterion 2 of the
  originating issue unaddressed
- **WHEN** divisor-guard completes its evaluation
- **THEN** a finding citing the issue number and criterion
  text is consolidated
- **AND** the council verdict is REQUEST CHANGES

#### Scenario: Satisfied criteria record traceability

- **GIVEN** every acceptance criterion of the originating
  issue is addressed by the diff
- **WHEN** the final report is rendered
- **THEN** each criterion's satisfied outcome is recorded
  with its issue number and grounding tier
- **AND** the check contributes no finding

#### Scenario: General-intent evaluation produces one outcome

- **GIVEN** a fetched free-form issue with no structured
  criteria and a diff that contradicts its stated intent
- **WHEN** divisor-guard completes its evaluation
- **THEN** a single unsatisfied general-intent outcome is
  emitted citing the issue number
- **AND** the report documents that evaluation ran against
  general intent with tier `best-effort`

#### Scenario: Labeled free-form issue evaluates general intent

- **GIVEN** a fetched issue carrying an intake-kit label
  whose body has no structured criteria
- **WHEN** divisor-guard completes its evaluation
- **THEN** a single general-intent outcome is emitted under
  grounding tier `strict`
- **AND** the report documents that evaluation ran against
  general intent, not gated criteria

### Requirement: Intent-Deviation Escape Hatch

**ID: RC-FR-013** This requirement MUST be satisfied.

When evaluation reveals an acceptance criterion is wrong —
the change legitimately invalidates the criterion rather
than failing to meet it — divisor-guard MUST emit a typed
intent-deviation finding that routes to governance (amend
the PRD/issue) instead of a plain pass or fail. The finding
MUST carry the invalidation evidence and a governance
recommendation, MUST NOT be silently dismissed, and MUST NOT
be closed by code fixes alone.

This is the review-council instance of the
IMPLEMENTATION_DEVIATION typed interruption proposed in
Discussion #444; the typed routing adopts that machinery
when it lands. In the interim the surface is concrete: the
Step 6 code-review fix loop short-circuits on a typed
intent-deviation finding and exits through an
`intent-deviation` variant of `format_unleash_exit` (added
by this change's tasks), carrying the invalidation
evidence and governance recommendation for explicit human
resolution. The finding resolves only through a governance
decision recorded in the branch-scoped human-decision
record (the `record_human_decision` surface) naming the
finding and the disposition — the issue's acceptance
criteria amended, or the override. The Step 6 resolution
step owns the read-back: before dispatching the next
review run, it reads the branch-scoped human-decision
record and forwards any disposition naming the finding
into the dispatch as review context, where divisor-guard
treats it as resolving the finding for that run.

#### Scenario: Invalid criterion routes to governance

- **GIVEN** the diff reveals an acceptance criterion assumed
  an API that does not exist
- **WHEN** divisor-guard evaluates that criterion
- **THEN** it emits an intent-deviation finding with the
  invalidation evidence and a governance recommendation
- **AND** the finding is not closable by further code fixes

#### Scenario: Deviation is not a silent pass

- **GIVEN** an intent-deviation finding is outstanding
- **WHEN** the council consolidates its verdict
- **THEN** the finding appears in the final report with its
  governance recommendation
- **AND** the verdict is REQUEST CHANGES while the deviation
  finding is unresolved
- **AND** the finding resolves only through a governance
  decision recorded in the branch-scoped human-decision
  record (the issue's acceptance criteria amended, or a
  human override naming the finding)

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
