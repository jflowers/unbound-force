## Context

Review matrix v3 profiles define `model` as optional.
When omitted, the dispatch planner correctly produces
advisor runs with `model: null`. However,
`dispatch_agent_run` rejects `resolved.model === null`
with `tier_model_unavailable` instead of falling back to
the parent session's model.

The `invoke_agent` tool already solves this problem for
host runs via `resolveHostModel()`, which introspects the
parent session's current assistant message to obtain the
active model identity and variant. The dispatch path
needs to reuse this mechanism for advisor runs whose
profiles omit a model.

## Goals / Non-Goals

### Goals
- Advisor runs with profiles that omit a `model` field
  inherit the parent OpenCode session model
- Extract `resolveHostModel` into the shared
  `agent-executor.ts` library (Composability First —
  both plugins import a single shared function)
- Host-resolved advisor provenance passes finalization
  validation with full Observable Quality metadata
- Existing behavior for non-advisor sources and explicit
  profile models is preserved
- Live plugin and scaffold asset remain identical

### Non-Goals
- Changing the review matrix schema or planner behavior
  — the planner already produces `model: null` correctly
- Supporting host-model fallback for `source: "explicit"`
  — explicit runs require deterministic model control
- Modifying `dispatch_review_runs` (parallel dispatch)
  — it delegates to `dispatch_agent_run` internally; the
  fix propagates automatically
- Adding host-model fallback to the `plan_review_dispatch`
  planner — it correctly emits `model: null` for
  profiles without models

## Decisions

### D1: Extract resolveHostModel to shared lib

**Decision**: Move `resolveHostModel` from
`invoke-agent/index.ts` into `.opencode/lib/agent-executor.ts`
with a minimal `HostResolutionContext` interface.

**Rationale**: Avoids duplicating host-model resolution
logic across two plugins. The shared lib already exports
`ModelIdentity`, `reportedModel`, `responseFailure`, and
`directModelIdentity` — all used by `resolveHostModel`.
Adding it there is a natural extension. The
`HostResolutionContext` interface (`sessionID`,
`messageID`, `directory`) avoids importing `ToolContext`
into the lib, keeping the dependency surface minimal.

**Constitution alignment**: Composability First — the
shared function is independently importable by any
plugin without cross-plugin coupling.

### D2: Advisor-only fallback branch

**Decision**: Only `source: "advisor"` triggers
host-model resolution when `resolved.model === null`.
Non-advisor sources (`"explicit"`, default) retain the
`tier_model_unavailable` rejection.

**Rationale**: Explicit runs require deterministic model
control — the caller specified a tier and expects it to
resolve to a concrete model. Advisor runs are generated
by the planner and inherit model configuration from the
matrix profile; when the profile intentionally omits a
model, the review matrix v3 contract specifies
parent-model fallback.

### D3: Host-resolved advisor provenance shape

**Decision**: Host-resolved advisors use the same
provenance contract as host runs:
- `requested_model: null`
- `provider: null`
- `model_id: null`
- `variant: null`
- `resolved_parent_model: <host combined>`
- `resolved_parent_variant: <host variant>`

**Rationale**: This reuses the existing provenance
validation path for host runs in `validateRunModel`.
The `source` field remains `"advisor"` (not `"host"`)
because the run was planned by the advisor system — only
the model resolution mechanism is borrowed from the
host path. Observable Quality is maintained: the null
requested provenance signals no explicit model was
configured, while resolved parent provenance records
the actual model used.

### D4: Error codes for resolution failure

**Decision**: Host-model resolution failure returns
`host_model_unavailable` (retryable). Abort-signal
cancellation returns `cancelled`.

**Rationale**: These match the error codes used by
`invoke_agent` for the same failure modes, maintaining
consistency across the dispatch system.

### D5: Private types stay private

**Decision**: `VariantSchema`, `CurrentMessageResponse`,
`CurrentAssistant`, and `CurrentAssistantWithVariant`
move into `agent-executor.ts` as module-private
definitions (not exported).

**Rationale**: These are implementation details of
`resolveHostModel`. Exporting them would expand the
lib's public API surface unnecessarily.

## Risks / Trade-offs

### Risk: invoke-agent refactor scope

Moving `resolveHostModel` and its supporting types out of
`invoke-agent/index.ts` is a refactor of a working
module. The call site changes from passing a full
`ToolContext` + `InvokeAgentDependencies` to passing a
`HostResolutionContext` + `client` + `signal`.

**Mitigation**: The invoke-agent test suite covers the
host-model resolution path. The refactor is mechanical
(same logic, different argument shape). No behavioral
change.

### Risk: scaffold drift

The scaffold copy of `review-dispatch/index.ts` must
receive identical changes.

**Mitigation**: The existing `make check` target
includes plugin tests that verify scaffold/live
identity. Any drift is caught in CI.

### Trade-off: Shared lib grows

Adding `resolveHostModel` and its private types increases
`agent-executor.ts` by approximately 60 lines.

**Accepted**: The alternative (duplicating the function
in the dispatch plugin) creates a maintenance burden
and violates Composability First.
