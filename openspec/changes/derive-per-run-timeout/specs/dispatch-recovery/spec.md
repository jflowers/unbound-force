<!-- capability: dispatch-recovery
     change: derive-per-run-timeout
     originating_issue: 849 -->

## MODIFIED Requirements

### Requirement: Partial Re-Dispatch

**ID: DR-FR-002** This requirement MUST be satisfied.

The dispatch tooling MUST support re-running the failed OR
cancelled reviewers of a dispatch session within that same
session, reusing the original plan entries, sibling evidence,
and per-run prompts. A cancelled run is an infrastructure
failure in recovery terms (for example, parent tool-call
window death) — not a judgment call to discard — so cancelled
runs MUST be re-run targets exactly like failed runs. A
partial re-dispatch MUST replace the prior run record of each
re-run reviewer rather than adding duplicate runs for a plan
entry. A re-run reviewer that succeeds MUST contribute its
findings and proposals to consolidation; one that fails or is
cancelled again MUST be handled by RD-FR-025 exclusion. A
re-run that exits before writing its replacement run record
MUST restore the prior run record as the active run file for
that plan entry, so the session returns to its pre-attempt
state and remains consolidatable. Partial re-dispatch MUST NOT
require re-running successful reviewers.

When a recovery invocation loads a dispatch session, any
superseded archive whose plan entry has no active run file
(a stranded archive left by a killed recovery invocation)
MUST be restored to the active run-file path before target
resolution, so the session is consolidatable and the restored
run is addressable by the normal re-run path. When several
superseded archives exist for the same plan entry, the most
recent MUST be restored.

Previously: only failed runs were re-run targets; a named run
whose status was not `failed` was refused, leaving
parent-killed `cancelled` runs with no re-run path, and no
restoration existed for stranded superseded archives.

#### Scenario: Re-run a failed reviewer

- **GIVEN** a dispatch session with three successful runs and
  one failed reviewer
- **WHEN** the operator partially re-dispatches the failed
  reviewer in the same session
- **THEN** only the failed reviewer runs again
- **AND** its new run replaces its prior run record for the
  same plan entry
- **AND** consolidation afterwards uses the three original
  successes plus the re-run reviewer's result

#### Scenario: Re-run a cancelled reviewer

- **GIVEN** a dispatch session holding a run whose status is
  `cancelled` (parent tool-call window death), with harvested
  findings and proposals in its run record
- **WHEN** the operator partially re-dispatches that reviewer
  in the same session
- **THEN** the cancelled reviewer runs again, reusing its
  persisted prompt and original plan entry
- **AND** its new run replaces the prior cancelled run record
  for the same plan entry
- **AND** the prior cancelled record — including its
  harvested submissions — remains archived for audit

#### Scenario: Refusal still protects successful runs

- **GIVEN** a dispatch session with successful runs
- **WHEN** the operator names a successful reviewer in the
  recovery agents filter
- **THEN** the action refuses that run per run, changes
  nothing for it, and reports the refusal reason
- **AND** recovery of the remaining failed or cancelled runs
  proceeds

#### Scenario: Stranded archive restored before resolution

- **GIVEN** a dispatch session where a killed recovery
  invocation left a superseded archive for a plan entry that
  has no active run file
- **WHEN** the operator invokes partial re-dispatch on that
  session
- **THEN** the stranded archive is restored to the active
  run-file path before targets are resolved
- **AND** the restored run is addressable as a re-run target
  according to its status
- **AND** the session remains consolidatable

#### Scenario: Re-run fails or is cancelled again

- **GIVEN** a partially re-dispatched reviewer that fails or
  is cancelled again
- **WHEN** the dispatch is consolidated
- **THEN** the re-run reviewer's submissions (if any) are
  excluded under RD-FR-025 with an explicit warning

#### Scenario: Re-run exits before execution

- **GIVEN** a partially re-dispatched reviewer whose re-run
  exits before child execution (policy load failure, unknown
  agent, model unavailability, cancellation, or an unexpected
  execution error), so no replacement run file is written
- **WHEN** the operator inspects the dispatch session
- **THEN** the prior run record is restored as the active run
  file for that plan entry
- **AND** the session remains consolidatable — the restored
  prior run is handled by RD-FR-025 exclusion rather than
  failing plan validation for a missing run

#### Scenario: Re-dispatch rejects invalid input

- **GIVEN** a recovery operator invoking the partial
  re-dispatch
- **WHEN** the correlation id is malformed, the agents filter
  is empty, or the timeout is zero
- **THEN** the action rejects the input with a validation
  error and changes nothing

#### Scenario: Re-dispatch reports not_found

- **GIVEN** a recovery operator invoking the partial
  re-dispatch
- **WHEN** the correlation id names no dispatch session, the
  session directory holds no run files, or a named agent has
  no run file
- **THEN** the action reports not_found without re-running
  anything
