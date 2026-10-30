## ADDED Requirements

### Requirement: Aggregate Correlation Forwarding by Orchestration Callers

**ID: RD-CF-001** This requirement MUST be satisfied.

Every orchestration command that chains the aggregate dispatch
tool into the consolidation tool MUST capture the correlation ID
reported by the aggregate dispatch result and pass it as the
explicit `correlation_id` on every subsequent consolidation
call in that workflow. The forwarded ID MUST take precedence
over in-process session-map resolution, and the map MUST remain
a same-session convenience fallback for ID-less consolidation
calls.

#### Scenario: Forwarded ID consolidates from a different session

- **GIVEN** an aggregate dispatch invocation that completed at
  least one run under correlation ID C, invoked from parent
  tool session S1
- **WHEN** the consolidation tool is invoked with
  `correlation_id: C` from a different tool session S2 that
  holds no in-process session-map entry for S2
- **THEN** the consolidation resolves C, returns the dispatch's
  run records and deduplicated findings, and reports
  `correlation_id: C` in its payload

#### Scenario: No-ID consolidation from a different session fails closed

- **GIVEN** the same completed dispatch under C from S1
- **WHEN** the consolidation tool is invoked without
  `correlation_id` from S2
- **THEN** the call fails closed as `not_found` without reading
  state belonging to any other dispatch session

#### Scenario: Same-session no-ID consolidation still resolves

- **GIVEN** the same completed dispatch under C from S1
- **WHEN** the consolidation tool is invoked without
  `correlation_id` from S1
- **THEN** the in-process session map resolves C and the call
  succeeds exactly as before this requirement was introduced

#### Scenario: Forwarded but unknown ID fails closed

- **GIVEN** a consolidation call whose forwarded `correlation_id`
  is a well-formed UUID that resolves to no persisted dispatch
  session
- **WHEN** the consolidation tool executes
- **THEN** the call fails closed as `not_found` with the
  supplied correlation ID echoed in the envelope

#### Scenario: Command prose forwards the ID

- **GIVEN** an orchestration command file that chains
  `dispatch_review_runs` into `consolidate_dispatch`
- **WHEN** the command file's dispatch and consolidation steps
  are inspected
- **THEN** the dispatch step instructs the caller to capture the
  correlation ID reported by the dispatch result, in the
  one-line prose summary and the machine-readable metadata
- **AND** every consolidation step in the command instructs the
  caller to pass that captured ID as `correlation_id`, covering
  the no-provenance retrieval call, every provenance
  finalization attempt, and identical-call retries

#### Scenario: Not-found with the forwarded ID is permanent

- **GIVEN** a consolidation call carrying the forwarded
  correlation ID for a dispatch that executed runs
- **WHEN** the call resolves to no persisted dispatch session
- **THEN** the command's failure-mode prose classifies the
  outcome as a permanent failure, because a plugin-process or
  tool-session split can no longer produce that state once the
  ID is forwarded

### Requirement: Dispatch Tool Description Forwarding Guidance

**ID: RD-CF-002** This requirement MUST be satisfied.

The aggregate dispatch tool's model-facing description MUST
direct callers to pass the returned correlation ID to the
consolidation tool, so the forwarding pattern is discoverable at
the tool surface independent of any command's prose. The
description addition MUST NOT alter the tool's input schema,
resolution precedence, or result shape, and the scaffolded
plugin mirror MUST remain byte-identical to the active plugin
source.

#### Scenario: Description carries forwarding guidance

- **GIVEN** the aggregate dispatch tool registered on the
  review-dispatch plugin surface
- **WHEN** its model-facing description is inspected
- **THEN** it directs the caller to pass the reported
  correlation ID to the consolidation tool

#### Scenario: Scaffold mirror stays identical

- **GIVEN** the active plugin source at
  `.opencode/plugins/review-dispatch/index.ts` and its
  scaffolded mirror under
  `internal/scaffold/assets/opencode/plugins/review-dispatch/`
- **WHEN** the two files are compared byte for byte
- **THEN** they are identical

### Requirement: Consolidation Schema Exposure Regression Lock

**ID: RD-CF-003** This requirement MUST be satisfied.

The consolidation tool's registration surface MUST expose
`correlation_id` as an optional parameter in the model-facing
tool schema, locking the RD-FR-027 contract that the RD-CF-001
forwarding depends on. The exposure MUST be verified by an
automated test against the registration surface so a schema
regression that silently drops the parameter is caught before
orchestration callers depend on it.

#### Scenario: Registration surface exposes the parameter

- **GIVEN** the review-dispatch plugin registered in a test
  harness
- **WHEN** the consolidation tool's declared arguments are
  inspected
- **THEN** `correlation_id` is present and optional
