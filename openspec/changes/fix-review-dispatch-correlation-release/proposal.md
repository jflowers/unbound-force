<!-- `originating_issue: 794` is set in .openspec.yaml so
     /uf.finale emits `Closes #794` in the PR body. -->

## Why

The review-dispatch plugin intentionally binds exactly one dispatch
correlation ID per opencode conversation and never releases it
(issue #794; symptoms #760 and #746). `sessionCorrelationMap`
(`.opencode/plugins/review-dispatch/index.ts`, module level) is a
`Map<parent-session-ID, correlation-ID>` that lives for the opencode
process lifetime; only `.get()` and `.set()` are ever called on it.
`dispatchAgentRun` mints a UUID on the first call from a parent
session and reuses it for every subsequent call in that session.

That binding implements the fix-loop contract of
fix-review-dispatch-recovery (#751, design D5): re-dispatching the
*same* review in one conversation with an updated plan, where session
metadata is replace-with-latest so `consolidate_dispatch` validates
runs against the current plan. The design contract is one dispatch
session = one review workflow = one conversation. Running multiple
*different* dispatch workflows from one conversation is outside that
contract and silently reuses the first workflow's correlation.

Live reproduction (2026-10-23 triage series):

1. `/uf.triage-issue` on #782 dispatched 5 reviewers under
   correlation `f38bb0f6-2e3e-4c4e-ba39-cef495379ed3` and finalized
   it (APPROVE / VALID) — artifact persisted to
   `.uf/artifacts/dispatch/f38bb0f6-….json`.
2. `/uf.triage-issue` on #771 from the *same* opencode conversation
   dispatched 6 reviewers; the dispatch resolved the conversation's
   existing correlation and reused `f38bb0f6`.
3. Dispatch-session state under a correlation is
   replace-with-latest, so #771's run files, plan, and session
   metadata replaced #782's. #782's finalization artifact on disk
   was untouched — dispatches do not write finalization artifacts.
4. Had #771 then been finalized, `persistEnvelope`'s collision path
   would have engaged: the artifact survives, but the second
   workflow's finalization record would land under a freshly minted
   correlation that does not match its dispatch session's run
   files — linkage corruption (artifact correlation ≠ dispatch
   session correlation), not data loss.

Every multi-dispatch conversation hits this: `/uf.unleash` runs a
spec review then a code review from one conversation;
`/uf.address-feedback` calls `dispatch_review_runs` once per Tier 2
feedback item; consecutive `/uf.triage-issue` or `/uf.review-pr`
runs reuse the first correlation. The dispatch side exposes no
correlation control — the explicit `correlation_id` escape hatch
(design D3 of #751) exists only on the read/finalize side
(`consolidate_dispatch`, `dispatch_status`).

## What Changes

1. **Per-dispatch correlation keying (issue direction 1).** Each
   `dispatch_review_runs` invocation mints a fresh correlation ID
   and creates its own dispatch session directory. The invocation's
   prompts, run files, and session metadata are persisted under
   that correlation, and `sessionCorrelationMap` is re-pointed to
   it, so the map tracks the conversation's *latest* dispatch
   rather than its first. Auto-resolution in `consolidate_dispatch`,
   `dispatch_status`, `read_assessment_fields`, and
   `build_review_prompts` keeps working unchanged against the
   latest dispatch.
2. **Observable correlation ID.** The `dispatch_review_runs` output
   reports the invocation's `correlation_id`, making each dispatch
   session addressable by explicit ID — symmetric with the D3
   read-side control — so older sessions in the same conversation
   remain retrievable.
3. **Preserved contracts.** The fix loop (D5) is preserved by
   reframing, not weakening: each fix-loop iteration is already a
   full re-dispatch of all included plan runs
   (`uf.review-council` step 4: "rerun all included plan runs, not
   only prior blockers"), so each iteration becomes a
   self-contained session carrying its own current plan and
   metadata, and prior iterations' session state survives as audit
   trail instead of being overwritten. The recovery tools
   (DR-FR-001/DR-FR-002) address a dispatch session purely by
   explicit `correlation_id` and are untouched. Finalizer
   validation, verdict computation, and the artifact schema are
   unchanged; `persistEnvelope`'s collision retry remains as a
   safety net.
4. **`dispatch_agent_run` unchanged.** Direct single-run dispatch
   keeps conversation-binding semantics (multi-call fan-out = one
   session; after an aggregate dispatch it joins the latest
   session). Explicit dispatch-side correlation control (issue
   direction 2) is deferred — documented as a non-goal with
   rationale in design.md.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `review-dispatch`: dispatch session correlation lifecycle — one
  correlation per `dispatch_review_runs` invocation, latest-dispatch
  session-map semantics, and correlation ID observability in the
  aggregate dispatch output.

### Removed Capabilities
- None.

## Impact

- **Code**: `.opencode/plugins/review-dispatch/index.ts`
  (correlation minting in `dispatchReviewRuns`, output schema,
  session-map documentation) and its scaffold twin
  `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
  (synced byte-identical per the scaffold-parity obligation). No Go
  code changes.
- **Tests**: `.opencode/test/dispatch-review-runs.test.ts` (the
  "correlation is shared" FR-007 test asserts the old mint-once
  behavior and is updated; new lifecycle scenarios), plus
  consolidation and registration tests as needed, via
  `make plugin-test`.
- **Consumers**: `/uf.triage-issue`, `/uf.review-council`,
  `/uf.review-pr`, `/uf.address-feedback`, and `/uf.unleash`
  review gates require no command changes — auto-resolution
  continues to resolve the dispatch the command just made. Commands
  MAY now pass the observable `correlation_id` explicitly when
  retrieving an older session.
- **Behavior preserved**: fail-closed finalization semantics
  (RD-FR-007), success-scoped consolidation (RD-FR-025),
  post-submission reclassification (RD-FR-026), cross-session
  resolution (RD-FR-027), recovery tooling (DR-FR-001..003), and
  the review-verdict artifact format are unchanged; no quality or
  governance gate is weakened.
- **Depends on**: `fix-review-dispatch-recovery` (currently
  unarchived). The spec delta cites RD-FR-027, which that change
  defines; this change MUST archive after it does, so the
  referenced requirement already exists in the spec registry when
  these deltas land.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

Each dispatch session remains a self-describing on-disk artifact
directory addressable by explicit correlation ID, and the
correlation ID is now carried in the dispatch output itself, so
parent commands and humans can retrieve, consolidate, or recover
any session without runtime coupling to plugin internals or to the
conversation that created it.

### II. Composability First

**Assessment**: PASS

The fix removes a hidden conversation-scoped limitation rather
than adding a dependency: every dispatch tool remains usable
standalone via explicit `correlation_id` (D3), and the aggregate
dispatch tool's sessions no longer depend on conversation lifetime
for isolation. No new mandatory dependency is introduced.

### III. Observable Quality

**Assessment**: PASS

The per-invocation `correlation_id` in `dispatch_review_runs`
output is machine-parseable provenance linking a dispatch result to
exactly one session directory and (after finalization) one
artifact. Artifact correlation now always matches its dispatch
session's correlation, restoring end-to-end traceability.

### IV. Testability

**Assessment**: PASS

Correlation lifecycle logic is pure TypeScript over temp-dir
dispatch sessions, testable in isolation with the existing vitest
suite and test exports (`_getSessionCorrelationMap`); the #794
reproduction (two dispatches from one parent session) is a unit
test, not a live-LLM scenario. Coverage strategy is defined in
tasks.md and enforced by `make plugin-test` / `make check`.

### V. Security by Default

**Assessment**: PASS

No new dependencies, no new external inputs, no privilege or
permission changes. New dispatch session directories inherit the
existing restrictive creation modes under the OS temp directory.

### VI. Deterministic Execution

**Assessment**: PASS

Correlation minting and session-map re-pointing are mechanical
tool logic with tests, not procedural prose in commands; the
observable `correlation_id` lets commands reference dispatch
sessions deterministically instead of relying on implicit
conversation state.

<!-- scaffolded by uf vdev -->
