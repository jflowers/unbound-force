<!-- capability: review-dispatch
     change: derive-per-run-timeout
     originating_issue: 849 -->

## ADDED Requirements

### Requirement: Per-Run Timeout Derivation

**ID: RD-FR-028** This requirement MUST be satisfied.

The dispatch tools MUST derive each reviewer run's timeout
from the work being dispatched via a deterministic formula in
the tool layer, whenever no explicit per-run timeout argument
is provided. The derivation MUST be a pure function of its
inputs: identical inputs MUST produce an identical timeout.

The derivation MUST compose, in order:

1. a base window resolved per RD-FR-029 (matrix
   `limits.per_run_timeout_seconds`, or the applicable
   per-tier override);
2. a prompt-size term that is monotonically non-decreasing in
   the run's prompt size in bytes;
3. a tier-based change-profile term that is monotonically
   non-decreasing in the run's resolved tier (lightweight,
   standard, heavy; zero for tier-less direct-model runs) —
   change-profile size is carried by the prompt-size term;
4. a contention multiplier strictly greater than 1, applied
   when the dispatch permits more than one concurrent run
   (the configured `max_parallel_runs` exceeds 1).

The derived value MUST be clamped to a configurable ceiling
that MUST NOT exceed 1_800_000 milliseconds (the existing
`TimeoutSchema`/`validateTimeout` bound). The derivation MUST
NOT reduce the effective timeout below the base window: the
configured limit remains a floor. When the configured ceiling
is below the resolved base window, the base floor MUST take
precedence: the effective ceiling is the base window. An
explicit per-run timeout argument MUST override the derived
value entirely.

A redispatch re-run executes sequentially; its derivation
MUST NOT apply the contention multiplier.

#### Scenario: Small work, no contention

- **GIVEN** a dispatch with a small prompt, a lightweight
  change profile, and `max_parallel_runs` of 1
- **WHEN** the per-run timeout is derived with no explicit
  argument
- **THEN** the effective timeout equals the base window
- **AND** no prompt, profile, or contention terms increase it

#### Scenario: Larger prompts scale the window

- **GIVEN** two dispatches identical except that one carries
  a materially larger prompt for the same reviewer
- **WHEN** per-run timeouts are derived for both
- **THEN** the larger prompt's effective timeout is greater
  than or equal to the smaller prompt's

#### Scenario: Parallel contention multiplies the window

- **GIVEN** a dispatch whose `max_parallel_runs` exceeds 1
- **WHEN** the per-run timeout is derived
- **THEN** the effective timeout is greater than or equal to
  the same derivation with `max_parallel_runs` of 1
- **AND** the unclamped derivation is strictly greater than
  the same derivation with `max_parallel_runs` of 1

#### Scenario: Derived value clamped at the ceiling

- **GIVEN** work signals large enough that the unclamped
  derivation exceeds the configurable ceiling
- **WHEN** the per-run timeout is derived
- **THEN** the effective timeout equals the ceiling
- **AND** the ceiling does not exceed 1_800_000 milliseconds

#### Scenario: Explicit argument bypasses derivation

- **GIVEN** any combination of work signals
- **WHEN** the caller provides an explicit per-run timeout
  argument
- **THEN** the explicit value is the effective timeout
- **AND** no derivation term modifies it

#### Scenario: Determinism

- **GIVEN** the same base window, prompt size, change
  profile, concurrency, and ceiling
- **WHEN** the derivation runs twice
- **THEN** both invocations produce the identical effective
  timeout

### Requirement: Matrix Limit as Execution Default

**ID: RD-FR-029** This requirement MUST be satisfied.

When the per-run timeout argument is omitted, the
`dispatch_review_runs` and `redispatch_failed_runs` tools MUST
resolve the derivation's base window from the review matrix
`limits.per_run_timeout_seconds` (converted to milliseconds)
— NOT from the agent-executor 600_000 millisecond flat
default. When the matrix omits the scalar limit, the existing
matrix-defaults fallback value applies as the base window.

When per-tier timeout overrides are configured in the matrix,
an override for the run's resolved tier MUST take precedence
over the scalar limit as that run's base window. Runs
dispatched without a tier (direct model) MUST use the scalar
limit.

Explicit per-run timeout arguments MUST still win over every
matrix-derived value. The matrix limit values themselves MUST
NOT be modified by this wiring: the configured
`per_run_timeout_seconds` is enforced as the base window
verbatim.

#### Scenario: Omitted argument uses the configured limit

- **GIVEN** a review matrix configuring
  `limits.per_run_timeout_seconds: 1200`
- **WHEN** `dispatch_review_runs` is invoked without
  `per_run_timeout_ms`
- **THEN** the derivation's base window is 1_200_000
  milliseconds
- **AND** no run resolves to the 600_000 millisecond flat
  default

#### Scenario: Redispatch honors the configured limit

- **GIVEN** the repository's review matrix configured
  `limits.per_run_timeout_seconds: 1200` at recovery time
- **WHEN** `redispatch_failed_runs` is invoked without a
  `timeout` argument
- **THEN** each re-run's base window is 1_200_000
  milliseconds

#### Scenario: Per-tier override wins for its tier

- **GIVEN** a matrix configuring a per-tier timeout override
  for the `heavy` tier larger than the scalar limit
- **WHEN** a run dispatches under the `heavy` tier with no
  explicit timeout argument
- **THEN** that run's base window is the `heavy` override
- **AND** a run under a tier without an override uses the
  scalar limit

#### Scenario: Explicit argument wins over the matrix

- **GIVEN** a matrix configuring
  `limits.per_run_timeout_seconds: 1200`
- **WHEN** `dispatch_review_runs` is invoked with an explicit
  `per_run_timeout_ms`
- **THEN** the explicit value is the effective timeout for
  every run
- **AND** the matrix limit does not modify it

#### Scenario: Matrix without the limit keeps the fallback

- **GIVEN** a review matrix whose `limits` omit
  `per_run_timeout_seconds`
- **WHEN** a per-run timeout is derived
- **THEN** the base window is the matrix-defaults fallback
  value
- **AND** the derivation still applies work and contention
  terms above it

### Requirement: Timeout Provenance in Run Records

**ID: RD-FR-030** This requirement MUST be satisfied.

Every run record persisted by `dispatch_review_runs` and
`redispatch_failed_runs` MUST carry a machine-readable
timeout provenance record stating the effective timeout in
milliseconds and its derivation inputs:
the value's source (explicit argument or derived), the base
window, the prompt size in bytes, the change-profile signals
used, the contention multiplier applied (if any), the
`max_parallel_runs` in effect, the ceiling, and whether the
derived value was clamped.

The provenance record MUST follow the established
run-file-only optional audit record pattern: older run files
that predate the field MUST remain valid, and readers MUST
NOT require its presence. `dispatch_status` SHOULD surface
each run's effective timeout when the provenance record is
present.

#### Scenario: Derived run records its inputs

- **GIVEN** a run dispatched with a derived timeout under
  parallel contention
- **WHEN** its run record is persisted
- **THEN** the record states the effective timeout, the
  source `derived`, the base window, the prompt size in
  bytes, the change-profile signals (the resolved tier and
  the session profile tier), the contention multiplier,
  `max_parallel_runs`, the ceiling, and the clamp outcome

#### Scenario: Explicit run records its value

- **GIVEN** a run dispatched with an explicit timeout
  argument
- **WHEN** its run record is persisted
- **THEN** the record states the effective timeout and the
  source `explicit`

#### Scenario: Older run files remain valid

- **GIVEN** run files persisted before this requirement
- **WHEN** the dispatch tooling reads them
- **THEN** the files parse and consolidate without requiring
  the timeout provenance record

#### Scenario: Postmortem observability

- **GIVEN** a run that timed out under contention
- **WHEN** an operator inspects its run record
- **THEN** the effective timeout and its derivation inputs
  are available without inferring contention from timestamps

### Requirement: Dispatch Operation Window Records

**ID: RD-FR-031** This requirement MUST be satisfied.

Every `dispatch_review_runs` and `redispatch_failed_runs`
invocation that owns a dispatch session (creating it, or
loading an existing one for recovery) MUST persist a
machine-readable operation record in the dispatch session
directory. Session-less invocations — input validation
failures and all-skip plans that exit before session
creation, and recovery invocations that resolve to
`not_found` — record nothing by design, because there is no
session directory to own. The record MUST be written
with its operation kind (dispatch or redispatch) and
`started_at` timestamp at invocation start, and MUST be
completed with `completed_at` and the invocation's terminal
state when the invocation settles. Run counts (completed,
failed, skipped for dispatches; redispatched, refused,
restored for recoveries) MUST be recorded on completion.
Recovery operations that observed non-fatal degradation
(review matrix load failure, stranded-archive restore
failure) MUST record those warnings on completion.

An operation record carrying `started_at` without
`completed_at` denotes an interrupted operation (for example,
parent tool-call window death). `dispatch_status` MUST report
such interrupted operations when reading a session.

#### Scenario: Completed dispatch records its window

- **GIVEN** a `dispatch_review_runs` invocation that settles
- **WHEN** the operator reads the session directory
- **THEN** an operation record exists with kind `dispatch`,
  `started_at`, `completed_at`, terminal state, and run counts

#### Scenario: Killed invocation leaves an interrupted record

- **GIVEN** a dispatch or redispatch invocation killed by
  parent tool-call window death after its start record was
  written
- **WHEN** a later `dispatch_status` reads the session
- **THEN** the operation record shows `started_at` without
  `completed_at`
- **AND** `dispatch_status` reports it as an interrupted
  operation

#### Scenario: Redispatch records its own window

- **GIVEN** a `redispatch_failed_runs` invocation
- **WHEN** it settles
- **THEN** an operation record exists with kind `redispatch`
  carrying its window and per-run outcomes summary
