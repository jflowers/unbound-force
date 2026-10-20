<!-- capability: review-dispatch
     change: fix-review-dispatch-recovery
     originating_issue: 751 -->

## ADDED Requirements

### Requirement: Success-Scoped Consolidation

**ID: RD-FR-025** This requirement MUST be satisfied.

The dispatch consolidation step MUST build its finalization payload
from successful runs only. Findings, proposals, and advisories
harvested from non-successful runs MUST be excluded from the
consolidated findings, the per-run findings arrays, the advisories,
and the proposals returned to the caller. Excluded submissions MUST
be surfaced as an explicit machine-readable warning that identifies
each excluded run (agent, run id, and discarded submission counts);
the consolidation step MUST NOT silently drop orphaned submissions.
Finalizer integrity validation (non-success runs MUST NOT vote or
emit findings) MUST remain unchanged, and a payload produced by
consolidation MUST satisfy that validation. When zero runs
succeeded, the fail-closed no-success behavior of RD-FR-007 MUST
apply unchanged.

#### Scenario: Failed run with accepted submissions

- **GIVEN** a dispatch session in which one child run failed after
  its structured submissions were accepted and at least one other
  run succeeded
- **WHEN** the dispatch is consolidated
- **THEN** the failed run's findings and proposals are excluded
  from the consolidated findings, the per-run findings arrays, the
  advisories, and the returned proposals
- **AND** the consolidation result carries a warning naming the
  failed run's agent, run id, and excluded submission counts
- **AND** the assembled payload passes finalizer validation
  without errors

#### Scenario: All runs successful

- **GIVEN** a dispatch session in which every run succeeded
- **WHEN** the dispatch is consolidated
- **THEN** the result is identical to consolidation before this
  requirement and carries no exclusion warning

#### Scenario: Zero successful runs

- **GIVEN** a dispatch session in which every run failed
- **WHEN** the dispatch is consolidated
- **THEN** the RD-FR-007 fail-closed no-success behavior applies
  unchanged
- **AND** every orphaned submission is reported in the exclusion
  warning

### Requirement: Post-Submission Completion Status

**ID: RD-FR-026** This requirement MUST be satisfied.

A child run that delivered accepted structured submissions
(findings or lesson proposals) and entered its final-response phase
MUST NOT be recorded as `failed` when its session aborts after
those submissions were accepted. The dispatch layer MUST classify
such a run as a successful run whose findings and proposals may
contribute to consolidation, while preserving the abort
circumstances in the run's persisted record for audit. A run whose
session aborted before any structured submission was accepted MUST
remain `failed`. Reclassification MUST NOT be applied to runs that
were cancelled, timed out, model-mismatched, or failed for reasons
other than a post-submission session abort.

#### Scenario: Session abort after structured submissions

- **GIVEN** a reviewer child whose findings and lesson proposal
  were accepted and that began generating its final review text
- **WHEN** the child session aborts from model context exhaustion
  during final-response generation
- **THEN** the run is recorded as successful rather than `failed`
- **AND** the run's findings and proposals contribute to
  consolidation and verdict computation
- **AND** the abort circumstances are preserved in the persisted
  run record

#### Scenario: Session abort before any submission

- **GIVEN** a reviewer child that aborted mid-review without any
  accepted structured submission
- **WHEN** the run result is recorded
- **THEN** the run remains `failed` with its error intact

#### Scenario: Timeout with accepted submissions

- **GIVEN** a reviewer child whose submissions were accepted and
  whose run then exceeded its timeout
- **WHEN** the run result is recorded
- **THEN** the run is recorded as `failed` and its submissions are
  handled by RD-FR-025 exclusion

#### Scenario: Model-mismatched run with accepted submissions

- **GIVEN** a reviewer child whose submissions were accepted and
  whose final-response text was captured, but whose reported model
  did not match the model it was dispatched with
- **WHEN** the run result is recorded
- **THEN** the run is recorded as `failed` and its submissions are
  handled by RD-FR-025 exclusion
- **AND** no post-submission abort audit is recorded for the run

### Requirement: Cross-Session Resolution and Observability

**ID: RD-FR-027** This requirement MUST be satisfied.

The dispatch status tool MUST report the per-run token usage
(input and output) recorded during execution so operators can
detect context-exhaustion risk in reviewer children. Usage
reporting MUST NOT alter run status, verdict computation, or
finalizer validation. The consolidation and dispatch status tools
MUST accept an optional explicit correlation_id parameter that
takes precedence over in-process session state, so a dispatch
session remains resolvable from a fresh parent session after a
restart; when the parameter is omitted, the in-process session
map resolves the session as before, and a correlation id that
resolves to no session MUST fail closed as not_found rather than
reading unrelated state. The dispatch run tool MUST persist the
supplied session metadata whenever it is provided on a run call,
replacing any earlier metadata file for the session, so
re-dispatches (fix loops) run against the current plan.

#### Scenario: Operator inspects a dispatch with failed children

- **GIVEN** a dispatch session in which two children each consumed
  roughly 365k input tokens before their sessions aborted
- **WHEN** the operator runs the dispatch status tool
- **THEN** each run's input and output token usage is included in
  the status output

#### Scenario: Recovery from a fresh parent session

- **GIVEN** a dispatch session whose parent session no longer
  holds in-process dispatch state (e.g. after a restart)
- **WHEN** the operator runs the consolidation or dispatch status
  tool with the session's explicit correlation id
- **THEN** the tool resolves that dispatch session and reports its
  runs
- **AND** a correlation id that resolves to no session fails
  closed as not_found

#### Scenario: Session metadata refreshed on re-dispatch

- **GIVEN** a dispatch session with persisted session metadata
- **WHEN** a dispatch run call supplies session metadata again
  (e.g. a fix-loop re-dispatch with a refreshed plan)
- **THEN** the supplied metadata is persisted for the session,
  replacing the earlier metadata file
