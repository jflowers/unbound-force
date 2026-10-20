<!-- capability: dispatch-recovery
     change: fix-review-dispatch-recovery
     originating_issue: 751 -->

## ADDED Requirements

### Requirement: Orphaned Submission Discard

**ID: DR-FR-001** This requirement MUST be satisfied.

The dispatch tooling MUST provide an explicit operator action that
discards orphaned submissions (findings and proposals) from
non-successful runs of a dispatch session. The discard action MUST
target only non-successful runs, MUST leave successful runs
untouched, and MUST record what was discarded (agent, run id, and
counts) in machine-readable form so the action remains auditable.
After a discard, consolidation of the session MUST complete without
orphaned-submission warnings for the discarded runs.

#### Scenario: Discard then finalize

- **GIVEN** a dispatch session with three successful runs and one
  failed run holding accepted findings and proposals
- **WHEN** the operator discards the failed run's orphaned
  submissions
- **THEN** the failed run's persisted record no longer carries
  findings or proposals
- **AND** the discard is recorded with the run's agent, run id,
  and discarded counts
- **AND** subsequent consolidation finalizes the dispatch using
  the three successful runs without an orphaned-submission warning
  for the discarded run

#### Scenario: Discard refuses successful runs

- **GIVEN** a dispatch session with successful runs
- **WHEN** the operator attempts to discard submissions of a
  successful run
- **THEN** the discard action rejects the request and changes
  nothing

#### Scenario: Discard rejects invalid input

- **GIVEN** a recovery operator invoking the discard action
- **WHEN** the correlation id is malformed or the agents filter is
  empty
- **THEN** the action rejects the input with a validation error
  and changes nothing

#### Scenario: Discard reports not_found

- **GIVEN** a recovery operator invoking the discard action
- **WHEN** the correlation id names no dispatch session, the
  session directory holds no run files, or a named agent has no
  run file
- **THEN** the action reports not_found without discarding
  anything

### Requirement: Partial Re-Dispatch

**ID: DR-FR-002** This requirement MUST be satisfied.

The dispatch tooling MUST support re-running only the failed
reviewers of a dispatch session within that same session, reusing
the original plan entries, sibling evidence, and per-run prompts.
A partial re-dispatch MUST replace the prior run record of each
re-run reviewer rather than adding duplicate runs for a plan
entry. A re-run reviewer that succeeds MUST contribute its
findings and proposals to consolidation; one that fails again MUST
be handled by RD-FR-025 exclusion. A re-run that exits before
writing its replacement run record MUST restore the prior run
record as the active run file for that plan entry, so the session
returns to its pre-attempt state and remains consolidatable.
Partial re-dispatch MUST NOT require re-running successful
reviewers.

#### Scenario: Re-run a failed reviewer

- **GIVEN** a dispatch session with three successful runs and one
  failed reviewer
- **WHEN** the operator partially re-dispatches the failed
  reviewer in the same session
- **THEN** only the failed reviewer runs again
- **AND** its new run replaces its prior run record for the same
  plan entry
- **AND** consolidation afterwards uses the three original
  successes plus the re-run reviewer's result

#### Scenario: Re-run fails again

- **GIVEN** a partially re-dispatched reviewer that fails again
- **WHEN** the dispatch is consolidated
- **THEN** the re-run reviewer's submissions (if any) are excluded
  under RD-FR-025 with an explicit warning

#### Scenario: Re-run exits before execution

- **GIVEN** a partially re-dispatched reviewer whose re-run exits
  before child execution (policy load failure, unknown agent,
  model unavailability, cancellation, or an unexpected execution
  error), so no replacement run file is written
- **WHEN** the operator inspects the dispatch session
- **THEN** the prior run record is restored as the active run
  file for that plan entry
- **AND** the session remains consolidatable — the restored prior
  run is handled by RD-FR-025 exclusion rather than failing plan
  validation for a missing run

#### Scenario: Re-dispatch rejects invalid input

- **GIVEN** a recovery operator invoking the partial re-dispatch
- **WHEN** the correlation id is malformed, the agents filter is
  empty, or the timeout is zero
- **THEN** the action rejects the input with a validation error
  and changes nothing

#### Scenario: Re-dispatch reports not_found

- **GIVEN** a recovery operator invoking the partial re-dispatch
- **WHEN** the correlation id names no dispatch session, the
  session directory holds no run files, or a named agent has no
  run file
- **THEN** the action reports not_found without re-running
  anything

### Requirement: Recovery Safety Invariants

**ID: DR-FR-003** This requirement MUST be satisfied.

Recovery operations MUST NOT alter finalizer validation rules,
MUST NOT fabricate or inflate findings, advisories, or verdicts,
and MUST NOT change run counts of unaffected runs. Every recovery
operation MUST be recorded in machine-readable form identifying
the operator action, the affected runs, and the discarded or
replaced data. Recovery MUST NOT weaken the RD-FR-007 requirement
that at least one successful run is required for an approving
result and that zero-success dispatches fail closed.

#### Scenario: Recovery preserves fail-closed behavior

- **GIVEN** a dispatch session in which every run failed
- **WHEN** the operator discards orphaned submissions or partially
  re-dispatches reviewers that fail again
- **THEN** consolidation still fails closed per RD-FR-007 rather
  than producing an approving result

#### Scenario: Recovery is auditable

- **GIVEN** any recovery operation has been performed on a
  dispatch session
- **WHEN** the operator inspects the session's records
- **THEN** the operation is identifiable with the affected runs
  and the discarded or replaced data
