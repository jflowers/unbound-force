## Why

Review matrix v3 defines profile `model` fields as optional,
with the intent that omitted models inherit the parent
OpenCode session model (host-model fallback). The planner
correctly produces advisor runs with `model: null` for
profiles that omit a model. However, `dispatch_agent_run`
unconditionally rejects `resolved.model === null` with
`tier_model_unavailable`, preventing advisor runs from
inheriting the host model.

This forces users to maintain a
`.uf/review-matrix.override.yaml` with explicit model
entries for every profile — defeating the purpose of the
optional model field and breaking `/uf.review-pr` and
council workflows when overrides are absent.

The `invoke_agent` tool already implements host-model
resolution via `resolveHostModel()`, which introspects the
parent session's current assistant message. The dispatch
path needs to use the same mechanism for advisor runs
whose profiles omit a model.

Fixes #693.

## What Changes

Extract `resolveHostModel` from the invoke-agent plugin
into the shared `agent-executor.ts` library so both
plugins can reuse it. Update `dispatch_agent_run` to call
`resolveHostModel` when an advisor run's profile has no
model, instead of rejecting with `tier_model_unavailable`.
Update finalization validation to accept host-resolved
advisor provenance. Mirror all changes in the scaffold
asset copy.

## Capabilities

### New Capabilities
- `advisor-host-model-fallback`: Advisor runs with
  profiles that omit a `model` field inherit the parent
  OpenCode session model via host-model resolution,
  matching the contract defined by review matrix v3.

### Modified Capabilities
- `resolveHostModel`: Extracted from invoke-agent into
  the shared `agent-executor.ts` library with a
  minimal `HostResolutionContext` interface, callable
  by both invoke-agent and review-dispatch plugins.
- `dispatch_agent_run`: Advisor source with null profile
  model triggers host-model resolution instead of
  `tier_model_unavailable` rejection. Non-advisor
  sources retain the existing rejection behavior.
- `validateRunModel` (finalization): Accepts
  host-resolved advisor provenance (`source: "advisor"`,
  `requested_model: null`, `resolved_parent_model:
  non-null`) using the same contract as host runs.

### Removed Capabilities
- None.

## Impact

- **Live plugin**: `.opencode/plugins/review-dispatch/index.ts`
  — model resolution, runData construction, finalization
  validation
- **Shared lib**: `.opencode/lib/agent-executor.ts` — new
  `resolveHostModel` export and `HostResolutionContext`
  interface
- **Invoke-agent plugin**: `.opencode/plugins/invoke-agent/index.ts`
  — remove duplicated `resolveHostModel` and local types,
  import from shared lib
- **Scaffold asset**:
  `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
  — identical changes to live plugin
- **Tests**: `dispatch-agent-run.test.ts` (2 new cases),
  `finalize-review-dispatch.test.ts` (1 new case)
- **No external API changes**: The `dispatch_agent_run`
  tool input schema is unchanged. The behavior change
  is internal — advisor runs with null models now
  succeed instead of failing.
- **Documentation impact**: None — no user-facing API
  changes, no AGENTS.md structural changes, no README
  updates required.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

This change preserves artifact-based communication.
`resolveHostModel` introspects the parent session's
model identity through an existing API — it does not
introduce synchronous inter-hero coupling. The dispatch
artifact envelope and provenance metadata remain
self-describing, with host-resolved advisors using the
same `resolved_parent_model` / `resolved_parent_variant`
fields already defined for host runs.

### II. Composability First

**Assessment**: PASS

Extracting `resolveHostModel` into the shared library
increases composability — both invoke-agent and
review-dispatch can use it independently. No mandatory
cross-plugin dependency is introduced; each plugin
imports the function from the shared lib, which is
already a dependency of both.

### III. Observable Quality

**Assessment**: PASS

Host-resolved advisor provenance is fully observable:
`requested_model: null` signals that no explicit model
was configured, while `resolved_parent_model` and
`resolved_parent_variant` record the actual model used.
Finalization validates this provenance, and
`model_mismatch` detection continues to work. The
artifact envelope retains machine-parseable output
with complete provenance.

### IV. Testability

**Assessment**: PASS

All new behavior is testable in isolation. The existing
`fakeClient()` test double already supports
`session.message`, so no external services are needed.
Three new test cases cover success, failure, and
finalization validation paths. The existing
`tier_model_unavailable` test guards against regression
for non-advisor sources.

### V. Security by Default

**Assessment**: PASS

The `source` field comparison uses strict string equality
(`=== "advisor"`) with no normalization — unexpected
values (empty string, null, case variations) fall through
to the existing `tier_model_unavailable` rejection path.
Host-model resolution introspects only the parent
session's current assistant message via the existing
OpenCode client API; it does not introduce new privilege
escalation paths. Error messages from resolution failures
use sanitized availability errors that do not leak
internal session details (session IDs, message IDs,
API paths). No new external dependencies are added.
