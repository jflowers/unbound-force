## ADDED Requirements

### FR-001: Per-Finding Presentation in Spec Review Mode

When a spec review verdict is REQUEST CHANGES, the command
MUST present every finding individually before any spec
artifact is modified. For each finding (any severity,
ordered CRITICAL, HIGH, MEDIUM, LOW), the command MUST:

- Print the finding details as plain session text: severity,
  file, description, root cause, and surrounding context
- Print per-option reasoning for each available choice and
  a recommendation with its justification
- Present the question tool below the printed text with the
  same options, the recommended option first and labeled
  "(Recommended)"
- Repeat for each finding until every finding is resolved
  (fixed, overridden, or the human pauses)

The FR-002 bulk shortcut (`"Apply all remaining LOW/MEDIUM
fixes"`) is an explicit exception to individual
presentation: one consented bulk action resolves all
remaining LOW/MEDIUM findings without presenting each
individually. HIGH/CRITICAL findings are never eligible
for the bulk shortcut.

The per-finding decision protocol MUST be wrapped in the
mandatory gate pattern:

- `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
  opening marker
- A session-resume guard (FR-006)
- The per-finding presentations and question tool
  invocations
- `>>> END MANDATORY GATE <<<` closing marker

The printed text above each question tool invocation MUST
contain the same finding details and options presented to
the question tool (visibility directive).

#### Scenario: REQUEST CHANGES with Mixed Severities

- **GIVEN** the council returned REQUEST CHANGES with 1 HIGH,
  2 MEDIUM, and 1 LOW finding
- **WHEN** the command processes the verdict
- **THEN** the command MUST present the HIGH finding first,
  printing its details, per-option reasoning, and
  recommendation as session text with the question tool
  below, then repeat for each MEDIUM and LOW finding in
  severity order

#### Scenario: Approving Verdicts Skip the Gate

- **GIVEN** the council returned APPROVE or APPROVE WITH
  ADVISORIES
- **WHEN** the command processes the verdict
- **THEN** the command MUST NOT present the per-finding
  gate; it records advisories and proceeds

### FR-002: Per-Finding Options

Each per-finding question tool invocation MUST offer exactly
these options, with the recommended option first and labeled
"(Recommended)":

- `"Apply suggested fix"` — apply the fix for this finding
  now. Available for every severity: a human-directed fix
  is a consented edit, not an autonomous auto-fix.
- `"Override & continue"` — waive the finding. The command
  MUST require a recorded justification before continuing.
- `"Show more context"` — print the full finding context,
  then re-present the same options. No spec edit occurs.
- `"Pause & exit"` — stop the review, making no further
  spec edits. The `/uf.unleash` embedding exits through
  the existing tool-rendered `spec-review` exit path
  (`format_unleash_exit`); a standalone
  `/uf.review-council` run stops and reports the
  unresolved findings.

`(Recommended)` is appended to the recommended option's
label (e.g. `"Apply suggested fix (Recommended)"`); the
underlying option set remains exactly the listed labels.

When the current finding is LOW or MEDIUM, the invocation
MUST additionally offer:

- `"Apply all remaining LOW/MEDIUM fixes"` — apply the
  remaining LOW/MEDIUM findings' fixes in one consented
  action and mark those findings resolved. This option MUST
  NOT appear for HIGH or CRITICAL findings and MUST NOT
  modify any HIGH/CRITICAL finding.

#### Scenario: HIGH Finding Option Set

- **GIVEN** the current finding is HIGH
- **WHEN** the question tool is presented
- **THEN** the options MUST be exactly `"Apply suggested
  fix"`, `"Override & continue"`, `"Show more context"`, and
  `"Pause & exit"` — the bulk option MUST NOT appear

#### Scenario: LOW Finding Bulk Shortcut

- **GIVEN** the current finding is LOW and 3 LOW/MEDIUM
  findings remain unresolved
- **WHEN** the human selects `"Apply all remaining
  LOW/MEDIUM fixes"`
- **THEN** the command MUST apply the fixes for the
  remaining LOW/MEDIUM findings, mark them resolved, and
  continue the loop at the next unresolved finding

#### Scenario: Override Requires Justification

- **GIVEN** the human selects `"Override & continue"` for a
  finding
- **WHEN** the command records the override
- **THEN** it MUST obtain and record a justification;
  an override without a recorded justification is invalid

### FR-003: No Autonomous Progression Past HIGH/CRITICAL

The pipeline MUST NOT proceed past a HIGH or CRITICAL
finding without an explicit per-finding human choice
(apply or override). While a HIGH/CRITICAL finding is
unresolved, the command's autonomous actions are limited
to printing finding details and context, and re-presenting
the question tool. The command MUST NOT autonomously fix,
waive, or defer a HIGH/CRITICAL finding, and MUST NOT
proceed to implementation while any HIGH/CRITICAL finding
is unresolved.

#### Scenario: Autonomous Actions Are Bounded

- **GIVEN** a REQUEST CHANGES verdict carries an unresolved
  CRITICAL finding
- **WHEN** the command is processing the per-finding loop
- **THEN** the command MUST NOT edit any spec file, proceed
  to implementation, or exit the loop except through a
  human question-tool choice or the `"Pause & exit"` option

#### Scenario: All Findings Resolved

- **GIVEN** every finding in the verdict is fixed or
  overridden with recorded justifications
- **WHEN** the per-finding loop completes
- **THEN** the command MUST proceed under FR-004 and FR-005

### FR-004: Override Recording

Every override MUST be recorded durably with the finding's
severity, description, and the human's justification. The
command MUST record overrides in the spec-review checkpoint
data and MUST surface them in the final report as
advisories, so waived findings remain visible after the
pipeline completes.

#### Scenario: Override Appears in Final Report

- **GIVEN** the human overrode a HIGH finding with
  justification "accepted risk: prototype scope"
- **WHEN** the pipeline completes
- **THEN** the final report MUST list the override as an
  advisory including the finding and its justification

### FR-005: Re-Review After Applied Fixes

When any fixes were applied (individually or via the bulk
shortcut), the command MUST re-run the review under the
existing iteration rules: re-resolve the immutable input,
re-validate the full plan, rerun every included reviewer
with a single sibling-evidence acquisition, and keep the
iteration counter. The per-finding gate re-presents on each
REQUEST CHANGES re-run. The 3-iteration cap is unchanged:
on a fourth REQUEST CHANGES encounter, the `/uf.unleash`
pipeline embedding MUST exit through the tool-rendered
`spec-review` exit path, and a standalone
`/uf.review-council` run MUST follow the existing
iteration-limit escalation (ask the user whether to
continue or stop).

Findings that match a recorded override (same file and
root cause) carry forward as resolved on re-runs: the
command MUST NOT re-present them through the per-finding
gate unless materially new information emerges. The
checkpoint overrides array carries all overrides recorded
across iterations.

#### Scenario: Fix Then Re-Review

- **GIVEN** the human applied fixes for 2 findings and
  overrode 1
- **WHEN** the per-finding loop completes
- **THEN** the command MUST re-run the review with all
  included reviewers before proceeding, carrying the
  iteration counter forward, and MUST carry the overridden
  finding forward as resolved if the re-run re-reports it
  (same file and root cause)

#### Scenario: Iteration Cap

- **GIVEN** the verdict is REQUEST CHANGES for the fourth
  encounter (iteration counter at 3)
- **WHEN** the command processes the verdict
- **THEN** the `/uf.unleash` embedding MUST exit via
  `format_unleash_exit` variant `spec-review` without
  presenting the per-finding gate; a standalone
  `/uf.review-council` run MUST ask the user whether to
  continue or stop

### FR-006: Session-Resume Guard for the Per-Finding Gate

Per-finding decisions captured before a context compression
or session resume are NOT valid. On resume, the command
MUST re-present every unresolved finding — including
findings whose resolution was recorded only in compressed
context — with fresh question-tool invocations. Applied
fixes and overrides recorded in durable checkpoint data
remain valid; the command MUST NOT re-ask about findings
whose durable records show resolution.

A fresh review finding matches a recorded override when it
shares the same file and root cause; matched findings are
resolved, not re-presented. When the loop completes via
overrides alone (no fixes applied, no re-run required),
the final report and pipeline summary record the outcome
as REQUEST CHANGES resolved by recorded overrides, listing
each override per FR-004.

#### Scenario: Compression Mid-Loop

- **GIVEN** the human resolved 2 of 5 findings and the
  session was then resumed from compressed context
- **WHEN** the command continues the per-finding loop
- **THEN** it MUST re-present the 3 unresolved findings and
  MUST NOT rely on the pre-compression consent for them

#### Scenario: Durable Resolution Stands

- **GIVEN** checkpoint data records that a finding was
  overridden with a justification before a resume
- **WHEN** the command re-anchors after resume
- **THEN** it MUST NOT re-present that finding

### FR-007: Severity Pack Clarifying Note

`.opencode/uf/packs/severity.md` MUST gain a clarifying
note after the Auto-Fix Policy (Spec Review Mode) table
distinguishing human-directed per-finding fixes (any
severity, applied only after explicit per-finding consent
in the spec review gate) from autonomous auto-fixes
(LOW/MEDIUM only). The severity definitions and the
autonomous auto-fix policy MUST remain unchanged.

#### Scenario: Boundary Clarified Without Policy Change

- **GIVEN** the severity pack's Auto-Fix Policy table says
  HIGH and CRITICAL are report-only
- **WHEN** the clarifying note is added
- **THEN** the table rows and severity definitions MUST be
  byte-identical to before, and the note MUST state that a
  human-directed "Apply suggested fix" choice for a
  HIGH/CRITICAL finding is a consented edit, not an
  autonomous auto-fix

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
