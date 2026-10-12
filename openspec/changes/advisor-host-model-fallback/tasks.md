<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Shared Library Extraction

- [x] 1.1 Add `HostResolutionContext` interface,
  `VariantSchema`, private response types, and
  `resolveHostModel` function to
  `.opencode/lib/agent-executor.ts`. Export
  `HostResolutionContext` and `resolveHostModel`.
  Keep `VariantSchema`, `CurrentMessageResponse`,
  `CurrentAssistant`, and `CurrentAssistantWithVariant`
  as module-private definitions.

## 2. Invoke-Agent Refactor

- [x] 2.1 Remove `resolveHostModel`, `VariantSchema`,
  `CurrentMessageResponse`, `CurrentAssistant`, and
  `CurrentAssistantWithVariant` from
  `.opencode/plugins/invoke-agent/index.ts`. Add
  import of `resolveHostModel` (and
  `HostResolutionContext` if needed) from the shared
  lib. Update the call site at line 224 to pass
  `{ sessionID: context.sessionID, messageID:
  context.messageID, directory: context.directory }`,
  `dependencies.client`, and `context.abort`.

## 3. Dispatch Plugin Changes

- [x] 3.1 Add `resolveHostModel` to the import from
  `../../lib/agent-executor.js` in
  `.opencode/plugins/review-dispatch/index.ts`.
- [x] 3.2 Update `dispatch_agent_run` model resolution
  block (~line 2782): change `requestedModelLabel`
  type to `string | null`, add `hostResolvedParent`
  tracker, insert advisor fallback branch inside
  `resolved.model === null` that calls
  `resolveHostModel` for `source: "advisor"` and
  returns `tier_model_unavailable` for other sources.
  Handle `host_model_unavailable` and `cancelled`
  error codes.
- [x] 3.3 Update `runData` construction (~line 2842):
  when `hostResolvedParent !== null`, set
  `requested_model`, `provider`, `model_id`, and
  `variant` to `null`, and set
  `resolved_parent_model` / `resolved_parent_variant`
  from `hostResolvedParent`.
- [x] 3.4 Update `validateRunModel` (~line 2081): add
  middle branch for `source === "advisor"` with
  `requested_model === null` (host-resolved advisor)
  using host-run provenance validation semantics.

## 4. Scaffold Asset Sync

- [x] 4.1 Mirror all changes from tasks 3.1-3.4 into
  `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`.
  Verify the live plugin and scaffold asset are
  identical.

## 5. Tests

- [x] 5.1 Add test in
  `.opencode/test/dispatch-agent-run.test.ts`:
  advisor run with empty profile inherits parent
  model. Input: `{ source: "advisor", agent:
  "divisor-guard", tier: "standard", prompt: "..." }`.
  Matrix fixture: `standard` profile with no `model`.
  Assert: `requested_model: null`,
  `resolved_parent_model: "p/m"`,
  `resolved_parent_variant: "active"`.
- [x] 5.2 Add test in
  `.opencode/test/dispatch-agent-run.test.ts`:
  advisor run with empty profile and `session.message`
  rejection returns `host_model_unavailable` with
  `retryable: true`.
- [x] 5.3 [P] Add test in
  `.opencode/test/finalize-review-dispatch.test.ts`:
  host-resolved advisor provenance passes validation.
  Run: `{ source: "advisor", requested_model: null,
  provider: null, model_id: null, variant: null,
  resolved_parent_model: "opencode-go/deepseek-v4-pro",
  resolved_parent_variant: "high" }`. Plan entry:
  `{ source: "advisor", model: null, variant: null }`.
  Assert: `result.status === "success"`.
- [x] 5.4 Add test in
  `.opencode/test/dispatch-agent-run.test.ts`:
  advisor run with empty profile and abort signal
  cancellation returns `cancelled`. Verify the
  cancellation scenario from spec.md is covered
  in isolation.

## 6. Verification

- [x] 6.1 Run `make plugin-test` to verify all existing
  and new tests pass.
- [x] 6.2 Run `make check` to verify lint, build,
  coverage gate, and full test suite.
- [x] 6.3 Verify the existing `tier_model_unavailable`
  test (dispatch-agent-run.test.ts lines 303-332)
  still passes — non-advisor sources with empty
  profiles must still be rejected.
- [x] 6.4 Verify constitution alignment: Autonomous
  Collaboration (artifact-based, no runtime coupling),
  Composability First (shared lib, independent import),
  Observable Quality (complete provenance metadata),
  Testability (isolation via fakeClient, no external
  services).

<!-- spec-review: passed -->
<!-- code-review: passed -->
