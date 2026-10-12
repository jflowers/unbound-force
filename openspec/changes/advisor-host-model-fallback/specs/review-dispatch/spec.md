## ADDED Requirements

### Requirement: Advisor Host-Model Fallback

When an advisor run's review-matrix profile omits a
`model` field, `dispatch_agent_run` MUST resolve the
parent session's active model via `resolveHostModel`
and use it as the execution model. The run MUST use
host-run provenance semantics: null requested model
provenance with resolved parent model provenance.

#### Scenario: Advisor inherits parent model

- **GIVEN** the review matrix profile for the
  requested tier has no `model` field
- **AND** the dispatch input has `source: "advisor"`
- **WHEN** `dispatch_agent_run` resolves the model
- **THEN** it calls `resolveHostModel` to obtain the
  parent session's active model identity and variant
- **AND** the run executes with the resolved model
- **AND** `requested_model` is `null`
- **AND** `resolved_parent_model` is the host model's
  combined identity
- **AND** `resolved_parent_variant` is the host
  model's active variant

#### Scenario: Host resolution failure

- **GIVEN** the review matrix profile has no `model`
- **AND** `source: "advisor"`
- **WHEN** `resolveHostModel` fails (session message
  unavailable)
- **THEN** `dispatch_agent_run` returns a failed result
  with error code `host_model_unavailable`
- **AND** `retryable` is `true`
- **AND** the error message is a sanitized availability
  error that MUST NOT leak internal session details
  (session IDs, message IDs, internal API paths)

#### Scenario: Host resolution cancelled

- **GIVEN** the review matrix profile has no `model`
- **AND** `source: "advisor"`
- **WHEN** `resolveHostModel` is aborted via signal
- **THEN** `dispatch_agent_run` returns a failed result
  with error code `cancelled`

#### Scenario: Non-advisor with empty profile rejected

- **GIVEN** the review matrix profile has no `model`
- **AND** `source` is not `"advisor"` (or is absent)
- **WHEN** `dispatch_agent_run` resolves the model
- **THEN** it returns `tier_model_unavailable` as before

The `source` field comparison MUST use strict string
equality (`=== "advisor"`) with no case normalization,
trimming, or coercion. Unexpected values (empty string,
`null`, `undefined`, case variations like `"Advisor"` or
`"ADVISOR"`) MUST fall through to the
`tier_model_unavailable` rejection path.

### Requirement: Shared Host-Model Resolution

`resolveHostModel` MUST be defined in the shared
`agent-executor.ts` library. Both `invoke-agent` and
`review-dispatch` plugins MUST import it from the
shared library. The function MUST accept a
`HostResolutionContext` (sessionID, messageID,
directory), a client, and an abort signal. The
resolution call is bounded by the abort signal; callers
SHOULD ensure their abort signal has a finite timeout
to prevent indefinite blocking when the parent session
API is unresponsive.

#### Scenario: Both plugins share resolveHostModel

- **GIVEN** `agent-executor.ts` exports
  `resolveHostModel` and `HostResolutionContext`
- **WHEN** `invoke-agent` resolves a host model
- **THEN** it calls `resolveHostModel` from the
  shared library
- **AND** `review-dispatch` calls the same function
  for advisor host-model fallback

## MODIFIED Requirements

### Requirement: Finalization Model Validation

Previously: `validateRunModel` validated two branches —
`source: "host"` (null requested, non-null resolved) and
all other sources (non-null requested, null resolved).

Modified: `validateRunModel` MUST validate three
branches:

1. `source: "host"` — unchanged (null requested
   provenance, non-null resolved on success)
2. `source: "advisor"` with `requested_model: null` —
   host-resolved advisor, validated identically to
   host runs (null requested provenance, non-null
   resolved on success)
3. All other sources — unchanged (non-null requested
   provenance, null resolved provenance)

#### Scenario: Host-resolved advisor passes validation

- **GIVEN** a finalization payload with a run where
  `source: "advisor"` and `requested_model: null`
- **AND** `resolved_parent_model` and
  `resolved_parent_variant` are non-null
- **AND** the plan entry has `model: null` and
  `variant: null`
- **WHEN** `finalize_review_dispatch` validates the run
- **THEN** validation succeeds

#### Scenario: Host-resolved advisor without resolved
  parent fails

- **GIVEN** a successful run with `source: "advisor"`
  and `requested_model: null`
- **AND** `resolved_parent_model` is null
- **WHEN** `finalize_review_dispatch` validates the run
- **THEN** validation fails with a message requiring
  resolved parent model and variant

### Requirement: Scaffold Asset Parity

Previously: The scaffold copy of
`review-dispatch/index.ts` MUST be identical to the
live plugin.

Modified: This requirement is unchanged, but the
scope now includes the new advisor host-model fallback
logic and the updated `validateRunModel` branches.

## REMOVED Requirements

None.
