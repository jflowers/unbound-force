## Why

`dispatch_review_runs` mints a durable, per-invocation
`correlation_id` and reports it in both machine-readable metadata
and the one-line prose summary (RD-CR-002, #794). Since the #751
recovery work (RD-FR-027, design D3), `consolidate_dispatch`
accepts an optional explicit `correlation_id` that takes
precedence over the in-process `sessionCorrelationMap`.

No orchestration caller threads it. `/uf.review-pr`,
`/uf.review-council`, `/uf.triage-issue`, `/uf.address-feedback`,
and `/uf.unleash` all chain `dispatch_review_runs` into
`consolidate_dispatch` while relying solely on the in-memory map
auto-resolution. That map only bridges calls executing in the
same opencode plugin process with the same `context.sessionID`.
When dispatch and consolidation run in different plugin processes
or tool sessions (process restart mid-workflow, session handoff),
the map is unavailable and consolidation fails closed with:

```text
{"status":"not_found","message":"no dispatch session for this session","runs":[]}
```

`uf.review-pr.md` Section 5a classifies that outcome as a
permanent failure for a dispatch that executed runs, so a
by-design recoverable state becomes a hard stop (issue #872).

## What Changes

1. **Forwarding instructions in all five orchestration
   commands.** Each command that chains
   `dispatch_review_runs` into `consolidate_dispatch` gains
   prose requiring the caller to capture the dispatch result's
   `correlation_id` (from the one-line summary and tool
   metadata) and pass it as `correlation_id` on every
   subsequent `consolidate_dispatch` call in that workflow —
   no-provenance retrieval, provenance finalization, and
   identical-call retries. Files: `uf.review-pr.md`,
   `uf.review-council.md`, `uf.triage-issue.md`,
   `uf.address-feedback.md`, `uf.unleash.md` (both dispatch
   sites), plus their scaffold mirrors under
   `internal/scaffold/assets/opencode/commands/`.

2. **Failure-mode prose correction.** With the ID forwarded, a
   `not_found` consolidation means the dispatch genuinely left
   no persisted session (all-skip or pre-mint failure) — a
   process split can no longer produce it. The retrieval
   failure classifications in the commands are updated to match.

3. **Plugin description guidance (no behavior change).** The
   `dispatch_review_runs` tool description gains one sentence
   directing callers to pass the returned `correlation_id` to
   `consolidate_dispatch`. `consolidate_dispatch` resolution
   precedence, fail-closed semantics, and schema are unchanged
   (correct since #751/#794). The scaffold mirror at
   `internal/scaffold/assets/opencode/plugins/review-dispatch/
   index.ts` is updated to stay byte-identical.

4. **Regression locks.** Cross-session consolidation driven by
   an aggregate-dispatch-minted `correlation_id` (different
   `ToolContext.sessionID`), no-ID cross-session `not_found`,
   same-session no-ID success, and a tool-schema exposure test
   asserting `consolidate_dispatch` exposes optional
   `correlation_id`.

### Scoping decision

Prior triage noted all five command files lack forwarding
instructions and allowed covering them or scoping the remainder
as follow-up. This change covers **all five now**: the chain
pattern, failure mode, and edit shape are identical in each
file, and leaving four known-broken callers behind a follow-up
repeats the review cycle for no risk reduction. The alternative
(review-pr only, remainder deferred) is recorded as a follow-up
option in `design.md` if reviewers prefer a smaller increment.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `review-dispatch`: orchestration commands that dispatch
  aggregate review runs MUST forward the dispatch result's
  `correlation_id` to every subsequent consolidation call in
  the same workflow, keeping in-map auto-resolution as a
  same-session convenience fallback only.

### Removed Capabilities

- None.

## Impact

- **Command prose**: five files under `.opencode/commands/`
  and their byte-identical scaffold mirrors under
  `internal/scaffold/assets/opencode/commands/`.
- **Plugin**: `.opencode/plugins/review-dispatch/index.ts`
  (description text only) and its scaffold mirror; enforced
  identical by the existing Go drift tests.
- **Tests**: `.opencode/test/dispatch-review-runs.test.ts`
  (cross-session suite), `.opencode/test/
  registration-surface.test.ts` (schema exposure), and site
  label refreshes in `golden-output-shape.test.ts`.
- **Go contract tests**: `internal/scaffold/
  command_contract_test.go` phrase assertions reviewed for
  compatibility with the new prose.
- **No gate changes**: no coverage thresholds, severity
  definitions, CI flags, or review limits are touched.
- **Behavior**: existing same-session dispatch behavior is
  unchanged; cross-session consolidation becomes reliable
  instead of failing closed.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

Heroes already collaborate through the durable dispatch-session
artifact; this change removes a hidden runtime coupling (the
in-process map) by making the artifact's identity handle
(`correlation_id`) an explicit, self-describing part of every
orchestration handoff from dispatch to consolidation.

### II. Composability First

**Assessment**: PASS

`consolidate_dispatch` remains fully usable standalone — the
explicit `correlation_id` is the standalone path — and the
same-session map fallback is preserved for direct tool use.
No new mandatory dependency is introduced; commands gain a
parameter pass-through, not a new tool.

### III. Observable Quality

**Assessment**: PASS

The forwarded ID is already reported in machine-readable
metadata and the prose summary (RD-CR-002), and it threads
provenance from dispatch through consolidation into the
persisted `review-dispatch` artifact. Failure outputs remain
machine-parseable `not_found` envelopes with the resolved
correlation ID.

### IV. Testability

**Assessment**: PASS

Cross-session behavior is verified in isolation with fixture
`ToolContext`s (distinct `sessionID`s), scratch dispatch
sessions, and the existing fake-client plugin harness — no
external services. Schema exposure is asserted against the
registration surface.

### V. Security by Default

**Assessment**: PASS

No new security surface is introduced. The forwarded
`correlation_id` enters `consolidate_dispatch` through its
existing optional UUID-validated argument (RD-CF-003) — no
new dependencies, file permissions, CI changes, or exec
surfaces are touched, and the failure mode stays fail-closed.

### VI. Deterministic Execution

**Assessment**: PASS

Per design D6: the forwarding instruction is orchestration-level
judgment prose, not mechanical procedural prose — no executable
tool can chain dispatch to consolidation across processes or
sessions; that gap is the bug being fixed. The mechanical
invariants around the prose (mirror identity, phrase contracts,
schema exposure) remain enforced by executable tests.
