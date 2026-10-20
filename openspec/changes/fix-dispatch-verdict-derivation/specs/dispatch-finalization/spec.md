<!--
  Adds FR-009..FR-012 to the dispatch-finalization capability.
  FR-001..FR-008 come from the dispatch-finalize-determinism
  change; this change MUST archive after it. Scaffold Asset
  Parity is not restated here -- the capability's existing
  FR-005 governs the mirror edit.
-->

## ADDED Requirements

### Requirement: Vote-Derived Workflow Verdict

FR-009: `consolidate_dispatch` MUST derive
`payload.workflow_result.value` and `payload.verdict` from the
per-run, kind-native workflow verdicts of successful runs,
using the same derivation function that
`finalize_review_dispatch` applies during semantic validation:
persona-collapsed votes with the strictest rule for council and
test-review kinds, `triageMajority` for triage, and any-ACCEPT
for feedback. Emission and validation MUST share one
derivation function so that a payload built by
`consolidate_dispatch` passes its own validation by
construction. When no run succeeded, the value MUST be the
no-success result (INCONCLUSIVE, or UNAVAILABLE when every run
failed with an availability error).

#### Scenario: Feedback split panel finalizes

- **GIVEN** a feedback dispatch session with one successful
  zero-findings run (run verdict `ACCEPT`) and one successful
  findings-bearing run (run verdict `AUTHOR-DECIDES`)
- **WHEN** `consolidate_dispatch` is called with provenance
- **THEN** internal finalization succeeds on the first attempt
- **AND** `workflow_result` is `{ kind: "feedback", value:
  "ACCEPT" }`
- **AND** the verdict is `APPROVE`
- **AND** the submitted findings remain in `payload.findings`

#### Scenario: Feedback payload is finalizer-valid

- **GIVEN** the same feedback split-panel session
- **WHEN** `consolidate_dispatch` is called without
  provenance and the returned payload is submitted to
  `finalize_review_dispatch` unmodified
- **THEN** structural and semantic validation pass without
  any agent-side transformation

#### Scenario: No successful runs finalizes as inconclusive

- **GIVEN** a dispatch session where every run failed and no
  findings were submitted
- **WHEN** `consolidate_dispatch` is called with provenance
- **THEN** the payload value is `INCONCLUSIVE` or
  `UNAVAILABLE` per the no-success rule
- **AND** the verdict is the pass-through of that value
- **AND** finalization succeeds with no value-mismatch
  rejection

### Requirement: Triage Majority Verdict

FR-010: For triage sessions the payload workflow value MUST be
the `triageMajority` of the persona-collapsed votes, not the
severity ladder over consolidated findings.

#### Scenario: Triage split-majority panel finalizes

- **GIVEN** a triage dispatch session with two successful
  zero-findings runs (verdict `VALID`) and one successful run
  bearing a CRITICAL or HIGH finding (verdict `INVALID`)
- **WHEN** `consolidate_dispatch` is called with provenance
- **THEN** internal finalization succeeds
- **AND** `workflow_result.value` is `VALID`
- **AND** the verdict is `APPROVE`

### Requirement: Council Output Preservation

FR-011: The change to verdict derivation MUST NOT alter
council and test-review payloads. For those kinds the
vote-based value equals the severity-ladder value on every
input, and emitted payloads MUST remain identical to the
previous severity-derived behavior.

#### Scenario: Mixed-severity council panel is unchanged

- **GIVEN** a council dispatch session with one successful
  run bearing a HIGH finding and one successful zero-findings
  run
- **WHEN** `consolidate_dispatch` is called
- **THEN** the verdict, `workflow_result.value`, findings,
  advisories, and `verdict_reason` are identical to the
  severity-derived behavior (`REQUEST CHANGES` with the HIGH
  finding consolidated)

### Requirement: Severity-Derived Reason Retained

FR-012: `verdict_reason` and advisory content MUST remain
derived from consolidated finding severities via the existing
severity ladder, and advisories MUST be built only when the
projected verdict is `APPROVE WITH ADVISORIES`. Submitted
findings MUST remain in `payload.findings` regardless of the
derived verdict.

#### Scenario: Split panel keeps severity context

- **GIVEN** the feedback split-panel session with one MEDIUM
  finding
- **WHEN** `consolidate_dispatch` is called
- **THEN** `verdict_reason` is the severity-derived text
- **AND** `payload.findings` contains the MEDIUM finding
- **AND** `advisories` is empty because the verdict is
  `APPROVE`
