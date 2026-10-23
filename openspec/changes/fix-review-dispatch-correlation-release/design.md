<!-- change: fix-review-dispatch-correlation-release
     originating_issue: 794 -->

## Context

Issue #794 confirmed live (2026-10-23 triage series) that the
review-dispatch plugin binds exactly one dispatch correlation ID
per opencode conversation for the process lifetime:
`sessionCorrelationMap` (`.opencode/plugins/review-dispatch/
index.ts`, module level) maps parent session ID to correlation ID
with only `.get()`/`.set()` — no delete, expiry, or reset.
`dispatchAgentRun` mints a UUID on the first call from a parent
session (the `isFirstCall` branch) and reuses it for all
subsequent calls; `dispatch_review_runs` inherits the binding
because its internal run calls go through `dispatchAgentRun`.

That binding implements the fix-loop contract of
fix-review-dispatch-recovery (#751, design D5): same-workflow
re-dispatches in one conversation share a correlation with
replace-with-latest session metadata, so `consolidate_dispatch`
validates runs against the current dispatch's plan. The design
contract is one dispatch session = one review workflow = one
conversation. Multiple *different* workflows from one conversation
(two `/uf.triage-issue` runs, `/uf.unleash` spec review then code
review, `/uf.address-feedback`'s one dispatch per Tier 2 feedback
item) silently reuse the first workflow's correlation:
replace-with-latest clobbers the earlier dispatch's run files,
plan, and metadata, and finalizing the second workflow engages
`persistEnvelope`'s EEXIST retry, publishing under a freshly
minted correlation that no longer matches its dispatch session —
linkage corruption, not data loss. Symptoms: #760, #746.

Consumers of the map today: `dispatchAgentRun` (mint-or-reuse),
`dispatchReviewRuns` (prompt-dir keying before dispatch; findings
collection after), `consolidate_dispatch` and `dispatch_status`
(explicit `correlation_id` fallback per D3 of #751),
`read_assessment_fields`, and the standalone `build_review_prompts`
tool. The dispatch side exposes no correlation control.

## Goals / Non-Goals

### Goals

- A second, different dispatch workflow from the same opencode
  conversation MUST get its own dispatch session and correlation
  (RD-CR-001): earlier sessions' persisted state MUST survive, and
  each finalization artifact's correlation MUST match its dispatch
  session.
- Fix-loop iterations MUST remain finalizable and self-consistent:
  each iteration validates against its own current plan and
  metadata (preserving the intent of D5).
- Auto-resolution MUST keep working with zero command changes:
  consolidation, status, and assessment-field retrieval without an
  explicit correlation ID resolve the dispatch the caller just
  made.
- The aggregate dispatch output MUST report its correlation ID so
  any session in the conversation is addressable explicitly
  (RD-CR-002), and direct single-run dispatch MUST keep its
  conversation binding (RD-CR-003).
- Recovery tools (DR-FR-001/002) MUST remain untouched and MUST
  find prior dispatch sessions intact rather than clobbered.

### Non-Goals

- No change to `dispatch_agent_run` semantics: direct single-run
  dispatch keeps conversation binding (mint on first direct call,
  reuse thereafter, join the latest aggregate session after one).
- No dispatch-side explicit correlation control (issue direction
  2: `new_dispatch` flag, `correlation_id` input on dispatch
  tools, or a reset tool) — deferred, see D6.
- No change to finalizer validation, verdict computation, the
  artifact schema, `persistEnvelope`'s collision retry, or any
  quality/governance gate.
- No change to recovery tooling, plan validation, or run-file
  format.
- No Go code changes (plugin is TypeScript; `make plugin-test`).

## Decisions

### D1: Fresh correlation per aggregate invocation, minted early

`dispatchReviewRuns` mints a fresh correlation ID immediately
after its input passes validation — before sibling evidence
acquisition, prompt building, and the included-entries check — and
re-points `sessionCorrelationMap` to it at mint time. Everything
downstream follows the invocation's correlation without further
changes: `buildReviewPrompts` receives it (prompts land under
`dispatch-<correlation>/prompts/` instead of the current
`prompts-<uuid>` fallback, which today only fires when the map is
empty), each internal `dispatchAgentRun` call reuses it (the map
is already set, so the mint branch stays dormant), session
metadata is persisted under it on the first internal run call,
and the post-dispatch findings collection re-read resolves it.

Minting early (rather than at first dispatched run) also fixes a
latent data-integrity bug: today, an invocation that skips all
plan entries or fails during prompt building leaves the map
pointing at the *previous* dispatch, so a subsequent no-provenance
retrieval returns the previous workflow's payload — for
`/uf.address-feedback`, that would store the previous item's
proposals under the current item. After D1, such an invocation
re-points the map to a correlation with no session directory, and
retrieval fails closed as not_found, which the commands already
treat as the all-skip outcome.

### D2: `dispatch_agent_run` keeps conversation binding

The single-run tool is the execution layer for fan-out (multiple
calls = one dispatch session) and for in-session joins after an
aggregate dispatch. Changing it to per-invocation minting would
shatter direct multi-call fan-out into N single-run sessions that
consolidation cannot validate as one plan. No current command
dispatches two different workflows through direct single-run calls
only — every multi-workflow flow goes through
`dispatch_review_runs` — so the conversation binding remains
correct for its remaining users.

### D3: Observable correlation ID in the aggregate output

`DispatchReviewRunsOutputSchema` gains a `correlation_id` field
reported on every result returned after input validation
(success, all-skip, prompt-building failure, budget-exhausted),
and the tool's `output` summary includes it. This is additive and
backward compatible. It makes the per-invocation session
addressable by the existing read-side explicit `correlation_id`
resolution (RD-FR-027 / design D3 of #751) — symmetric control:
the dispatch side reports, the read side accepts.

### D4: Fix-loop contract preserved by reframing

The command contract already defines a fix-loop iteration as a
full re-dispatch ("rerun all included plan runs, not only prior
blockers" — `uf.review-council` step 4) finalized independently
("Finalize every iteration" — Section 5). Under D1 each iteration
is a self-contained dispatch session carrying its own refreshed
plan, metadata, and head SHA; consolidation auto-resolves the
latest session and validates against that iteration's plan — the
same outcome D5's replace-with-latest achieved, without the
cross-workflow clobbering. The D5 mechanism itself (persist
session metadata whenever supplied on a run call) is unchanged
and still applies to direct run calls joining an existing session.
RD-FR-027's "Session metadata refreshed on re-dispatch" scenario
remains satisfiable through direct run calls; its fix-loop
example is superseded by RD-CR-001's self-contained-iteration
scenario, and the archive step should reconcile that example.
Recovery tools address sessions purely by explicit correlation ID
and now find prior sessions intact — strictly better than today,
where a second workflow's dispatch destroys the first's state.

### D5: Map documentation rewrite

The `sessionCorrelationMap` doc comment (which currently
documents mint-once-reuse-forever) is rewritten to describe
latest-dispatch semantics: the map resolves a parent session to
its most recent aggregate dispatch invocation's correlation;
single-run calls mint when absent and reuse otherwise. The
test-only export `_getSessionCorrelationMap` is unchanged.

### D6: Rejected and deferred alternatives

- **Content-keyed correlation** (keying by workflow identity such
  as command/mode/issue): rejected — workflow identity is fuzzy
  (head SHA changes across fix-loop iterations; two triages of
  the same issue are ambiguous), and per-invocation minting with
  latest-wins resolution achieves the same guarantee
  deterministically.
- **Explicit release/reset control** (issue direction 2):
  deferred — per-invocation minting removes the need on the
  aggregate path (auto-resolution means "the dispatch I just
  made"), the read-side explicit `correlation_id` already covers
  cross-session and older-session recovery, and no current flow
  dispatches multiple workflows via direct single-run calls. A
  dispatch-side `correlation_id` input remains a backward-
  compatible follow-up if such a flow emerges.
- **Map expiry/TTL or deletion**: rejected — the map is bounded
  (one entry per conversation per process) and the failure was
  semantic reuse, not unbounded growth.

### Constitution alignment (from proposal)

- **I. Autonomous Collaboration**: every dispatch session stays a
  self-describing on-disk artifact directory addressable by
  explicit correlation ID, now also carried in the dispatch
  output itself (D3).
- **II. Composability First**: tools remain standalone via
  explicit `correlation_id`; the fix removes a hidden
  conversation-lifetime coupling instead of adding dependencies.
- **III. Observable Quality**: artifact correlation now always
  matches its dispatch session's correlation, restoring
  end-to-end traceability (D1); the correlation ID is
  machine-parseable output (D3).
- **IV. Testability**: D1-D3 are pure TypeScript over temp-dir
  dispatch sessions, testable with the existing vitest suite and
  `_getSessionCorrelationMap` export.
- **V. Security by Default**: no new dependencies or inputs; new
  session directories inherit existing restrictive modes.
- **VI. Deterministic Execution**: correlation lifecycle is
  tested tool logic, not command prose; commands can reference
  sessions by explicit ID.

## Risks / Trade-offs

- **R1: Fix-loop re-dispatch cost.** Each iteration re-runs all
  included reviewers instead of reusing earlier successes.
  Unchanged from the command's existing explicit contract; no
  regression.
- **R2: Behavioral boundary for subset re-dispatch.** A caller
  that expected a second `dispatch_review_runs` invocation to
  *continue* the first invocation's session (accumulating runs)
  now gets a fresh session missing the earlier runs. No such
  caller exists: commands rerun all included plan entries, and
  partial in-session re-dispatch is `redispatch_failed_runs`
  (DR-FR-002). Documented as the RD-CR-001 boundary.
- **R3: Session-less map entries.** An all-skip or prompt-failure
  invocation re-points the map to a correlation with no session
  directory; a later direct single-run call joins that correlation
  and creates the directory. Benign and consistent with
  latest-dispatch semantics.
- **R4: Existing test asserts the old behavior.**
  `dispatch-review-runs.test.ts` ("persists session metadata file
  from first run and correlation is shared") asserts mint-once
  reuse; it is updated to assert the new lifecycle. This is the
  intended behavioral change, not a gate weakening.
- **R5: Older-session retrieval requires sequencing or explicit
  ID.** After a second dispatch, retrieving the first session
  without an explicit `correlation_id` resolves the second. The
  commands retrieve immediately after each dispatch (correct
  sequencing), and D3's observable correlation ID provides the
  explicit escape hatch.
- **R6: Archive-order dependency.** `fix-review-dispatch-recovery`
  is unarchived and defines RD-FR-027, which RD-CR-001 cites; this
  change MUST archive after it so the cited requirement exists in
  the spec registry when these deltas land.
<!-- scaffolded by uf vdev -->
