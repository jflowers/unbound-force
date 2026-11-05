<!-- capability: delegation-timeouts
     change: delegation-timeout-budgets
     originating_issue: 930
     rationale: new capability covering hierarchical delegation
     budgets, idle timeout, the command-path timeout ceiling,
     and resume-carrying timeout results; design decisions
     D1-D5 live in this change's design.md
-->

Requirement numbering: this change allocates DT-FR-001 through
DT-FR-004 for the requirements added below. DT-FR-005 through
DT-FR-012 are reserved for future delegation-timeouts changes.
The sibling capability `run-plan-command` (delta in this same
change) allocates RPC-FR-001 and reserves RPC-FR-002 through
RPC-FR-010 for future run-plan-command changes. Requirement ids
MUST stay inside the allocated range.

## ADDED Requirements

### Requirement: Hierarchical Delegation Budgets

**ID: DT-FR-001** This requirement MUST be satisfied.

The shared agent executor MUST record each child session's
absolute deadline in a process-wide budget registry for the
duration of the run and MUST remove it when the run ends and the
child's termination is confirmed (its prompt returned, or its
abort was accepted). A run that ends with unconfirmed child
termination MUST retain the entry as a fail-closed tombstone so
nested calls still clamp to the passed deadline.

Before creating a child session, the executor MUST resolve the
inherited deadline of its parent session: a registry entry for the
parent session, else the first registered ancestor found by
walking session `parentID` links up to 8 levels. Lookup failures
MUST be treated as "no inherited deadline".

With an inherited deadline, the effective wall-clock timeout MUST
be the lesser of the requested timeout and the remaining budget
minus a 60-second reserve. When less than 30 seconds remain after
the reserve, the executor MUST fail without creating a child
session, with error code `budget_exhausted`, non-retryable.

#### Scenario: Nested call clamped to parent budget

- **GIVEN** a child session registered with 20 minutes remaining
- **WHEN** a tool inside that child requests a 30-minute run
- **THEN** the nested run's effective timeout is 19 minutes
- **AND** its timeout details report `budget_clamped: true`

#### Scenario: Parent budget exhausted

- **GIVEN** a child session registered with 70 seconds remaining
- **WHEN** a tool inside that child starts a nested run
- **THEN** no child session is created
- **AND** the result fails with `budget_exhausted`, not retryable

#### Scenario: Top-level call unchanged

- **GIVEN** a session with no registered ancestor
- **WHEN** a run is requested with a 10-minute timeout
- **THEN** the effective timeout is 10 minutes

#### Scenario: Unconfirmed termination retains the deadline

- **GIVEN** a child whose cleanup abort fails or hangs after the
  wall-clock timeout fires
- **WHEN** the run's result is returned
- **THEN** the child's deadline entry stays registered so any
  nested run under it still clamps to the passed deadline

### Requirement: Idle Timeout

**ID: DT-FR-002** This requirement MUST be satisfied.

When an idle timeout is configured, the executor MUST poll the
child's session subtree for activity and MUST abort the child with
error code `idle_timeout` (retryable) only after no activity change
has been observed for the idle window and at least one probe has
succeeded since the last observed change. A failed probe MUST NOT
reset or advance the idle clock. Activity in any descendant session
MUST count as progress for the child, including growth of a running
tool's streamed `state.metadata` (for example bash output). The
probe MUST walk the subtree depth-first, newest child first, so an
active grandchild is reached even when the child has more finished
direct children than the session cap. A probe that completes after
the child's prompt returned MUST NOT abort the child or change the
run's result.

`uf_delegate_command` MUST accept `idle_timeout` (60,000 -
1,800,000 ms) and MUST default it to 600,000 ms.

#### Scenario: Active child survives the idle window

- **GIVEN** a delegation with a 10-minute idle timeout
- **AND** a grandchild session that posts new parts every minute
- **WHEN** 15 minutes pass
- **THEN** the delegation is not aborted

#### Scenario: Stalled child aborted early

- **GIVEN** a delegation with a 4-hour wall clock and a 10-minute
  idle timeout
- **WHEN** no session in the subtree changes for 10 minutes
- **THEN** the child is aborted with `idle_timeout`

#### Scenario: Long command still printing

- **GIVEN** a delegation with a 10-minute idle timeout
- **AND** a child running a 15-minute bash command whose
  `state.metadata.output` grows every minute
- **WHEN** 15 minutes pass
- **THEN** the delegation is not aborted

#### Scenario: Stale message ordering still detects subtree growth

- **GIVEN** a host that returns the oldest message first from the
  probe's latest-message request
- **AND** the subtree gains a new descendant session between
  probes
- **THEN** the fingerprint still changes and the child counts as
  active

#### Scenario: Probe unavailable

- **GIVEN** a host whose activity probe always fails
- **WHEN** the idle window elapses
- **THEN** the child is not aborted by the idle clock

### Requirement: Command-Path Timeout Ceiling

**ID: DT-FR-003** This requirement MUST be satisfied.

`uf_delegate_command` MUST accept `timeout` up to 14,400,000 ms
when `command_path` is supplied and MUST reject a `timeout` above
1,800,000 ms when it is not.

#### Scenario: Prompt-only delegation over the cap

- **GIVEN** a prompt-only delegation
- **WHEN** it requests `timeout: 3600000`
- **THEN** validation fails before any child session is created

### Requirement: Resume-Carrying Timeout Results

**ID: DT-FR-004** This requirement MUST be satisfied.

When a run ends by a limit, the executor result MUST carry a
`timeout` object with `kind` (`wall_clock`, `idle`, `budget`),
`effective_ms`, `requested_ms`, `budget_clamped`,
`idle_timeout_ms`, `elapsed_ms`, `last_progress_ms_ago`,
`child_active`, and `pending_question`. Every result that reached
the executor, limit-ended or not, MUST also carry an `applied`
record with `effective_ms`, `requested_ms`, `budget_clamped`, and
`idle_timeout_ms` recording the limits actually applied.

`uf_delegate_command` MUST thread that object into its
`DELEGATE_FAILED` envelope and, for command-path delegations, MUST
add `resume` with the state `command`, `key`,
`last_checkpoint_step`, and `completed_steps` read from the
progress state store after the child stops; an unreadable state
MUST yield `resume: null` beside a `resume_error` field carrying
the sanitized failure reason.

#### Scenario: Idle timeout of a checkpointed command

- **GIVEN** a `/uf.unleash` command-path delegation whose child
  recorded `plan` as its current step
- **WHEN** the child is aborted by the idle timeout
- **THEN** the envelope carries `timeout.kind: "idle"`
- **AND** `resume.last_checkpoint_step: "plan"`
- **AND** `child_session_id`

#### Scenario: Question-gate wedge

- **GIVEN** a delegated child whose latest part is a running
  `question` tool call
- **WHEN** the idle timeout fires
- **THEN** the envelope carries `timeout.pending_question: true`

#### Scenario: Unreadable resume state carries the reason

- **GIVEN** a command-path delegation whose progress state read
  throws
- **WHEN** the envelope is built
- **THEN** it carries `resume: null` beside a `resume_error`
  string

#### Scenario: Successful run records its applied limits

- **GIVEN** a nested run clamped from 30 minutes to 19 minutes
- **WHEN** the run completes successfully
- **THEN** the result carries `applied.budget_clamped: true` and
  `applied.effective_ms: 1140000`

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
