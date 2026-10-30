## Context

The review-dispatch plugin splits review orchestration across
two tools: `dispatch_review_runs` (aggregate evidence, prompt
building, and child-run dispatch) and `consolidate_dispatch`
(retrieval, deduplication, verdict, optional finalization).
Since #794 (RD-CR-002) the aggregate tool mints a per-invocation
`correlation_id`, persists the dispatch session under it, and
reports it in tool metadata and the one-line prose summary.
Since #751 (RD-FR-027, design D3) `consolidate_dispatch`
accepts an optional explicit `correlation_id` that takes
precedence over the in-process `sessionCorrelationMap`.

The five orchestration commands that chain these tools
(`uf.review-pr.md`, `uf.review-council.md`,
`uf.triage-issue.md`, `uf.address-feedback.md`,
`uf.unleash.md`) never forward the ID. They rely on the
in-memory map, which only bridges calls executing in the same
plugin process with the same `context.sessionID`. When dispatch
and consolidation split across processes or sessions, the map
misses and consolidation fails closed as `not_found`; command
prose then classifies that as a permanent failure (issue #872).
The constitution alignment assessment in `proposal.md` (all
four principles PASS) carries into every decision below.

## Goals / Non-Goals

### Goals

- Every orchestration command forwards the aggregate
  dispatch's reported `correlation_id` to every subsequent
  `consolidate_dispatch` call in the same workflow.
- Cross-session consolidation driven by an aggregate-minted
  correlation ID is verified by automated tests.
- The fail-closed semantics (absent ID, unknown ID, unreadable
  session files) and same-session map fallback are locked by
  regression tests, not changed.
- The model-facing tool schema exposure of
  `consolidate_dispatch.correlation_id` is locked by a
  registration-surface test.
- Scaffold mirrors (commands and plugin) stay byte-identical
  to their canonical sources.

### Non-Goals

- No change to tool resolution precedence, fail-closed
  behavior, input schemas, or result shapes — those are
  correct since #751/#794.
- No change to `dispatch_status`, the recovery tools, or
  direct `dispatch_agent_run` flows (their correlation
  controls already work and are covered by prior changes).
- No new persistence, no durable cross-process session
  registry — the persisted dispatch-session directory already
  is the durable store; only the caller threading is missing.
- No change to quality gates, coverage thresholds, or CI
  flags.

## Decisions

### D1: Forward always, not conditionally

Command prose mandates passing the captured `correlation_id`
on every consolidation call — retrieval, finalization, and
retries — rather than conditioning on whether the map might
still resolve. The calling model cannot observe in-process map
state, so conditional forwarding would be untestable prose;
unconditional forwarding is deterministic and matches how the
commands already phrase exact-once call discipline. The map
remains the fallback for ID-less direct tool use
(Constitution II: composability preserved).

### D2: The prose summary is the ID carrier

`uf.review-pr.md` already documents that large metadata arrays
never reach the calling model, and RD-CR-002 deliberately
renders the `correlation_id` into the one-line summary "so the
dispatch session is addressable from the prose output alone".
The forwarding prose therefore instructs capture from the
one-line summary, naming tool metadata as the secondary
channel for harnesses that surface it.

### D3: Cover all five command files in this increment

The chain pattern (`dispatch_review_runs` → no-provenance
retrieval → provenance finalization → retries) and the failure
mode are identical in all five commands; the edit is a small,
mechanical prose addition per file. Triage learning
(2026-10-30): a durable-ID escape hatch is incomplete until
every orchestration caller threads the producer's returned ID —
audit all producer→caller→consumer chains in the same
increment. Alternative — fix `/uf.review-pr` only and defer the
other four — is recorded as follow-up option F-1 in case
reviewers prefer a smaller increment; it is not recommended
because it leaves four known-broken callers behind another
review cycle.

### D4: Plugin change is description-only

The only plugin-source edit is one sentence of forwarding
guidance in the `dispatch_review_runs` description (RD-CF-002),
mirrored to the scaffold asset and enforced by the existing Go
drift tests. Functional behavior is untouched: explicit-ID
precedence, `not_found` fail-closed envelopes, and schema
exposure all landed with #751/#794. This is the minimal change
that makes the pattern discoverable at the tool surface.

### D5: Failure-mode prose reclassification

With the ID forwarded, a `not_found` consolidation for a
dispatch that executed runs can no longer be caused by a
process or session split — it means no persisted session
exists, which is genuinely permanent. Each command's retrieval
failure section keeps its permanent/transient/all-skip
classification but the prose no longer needs to anticipate the
map-miss case; the all-skip valid-outcome classification is
unchanged. Fail-closed severity is not weakened anywhere.

### D6: Determinism-gate classification

The forwarding instruction is orchestration-level judgment
prose, not mechanical procedural prose: no executable tool can
chain dispatch to consolidation across processes or sessions —
that gap is the bug being fixed. The ID must travel through
the calling model's context, and command prose is the only
viable mechanism. Mechanical invariants around it (mirror
identity, phrase contracts, schema exposure) remain enforced
by executable tests.

### D7: Test strategy

- **Cross-session aggregate path** (new, in
  `dispatch-review-runs.test.ts`): dispatch via
  `dispatch_review_runs` under session S1, then consolidate
  with `{ correlation_id }` from a fixture `ToolContext` with a
  different `sessionID`; assert run and finding retrieval.
  Distinct from `dispatch-recovery.test.ts`, which hand-writes
  run files to test the recovery tools rather than the
  aggregate-minted path.
- **Negative and regression locks**: no-ID cross-session
  `not_found`; same-session no-ID success; unknown forwarded
  ID `not_found`.
- **Schema exposure lock** (new, in
  `registration-surface.test.ts`): the `consolidate_dispatch`
  registration declares `correlation_id` as an optional
  argument.
- **Command prose contracts**: `command_contract_test.go`
  gains presence-only phrase assertions for the forwarding
  instruction in each of the five commands (same mechanism as
  its existing assertions). Existing asserted phrases are
  preserved unless the prose edit necessarily touches them;
  any update is a contract refresh matching reviewed prose,
  never a gate weakening.
- **Site label refresh**: `golden-output-shape.test.ts` line
  references for the edited commands are updated so the
  documented call sites stay accurate.

## Risks / Trade-offs

- **Prose compliance is model-dependent.** The forwarding
  instruction is followed by an LLM, so a distracted model
  could still omit the ID. Mitigations: tool-description
  guidance (D4), Go phrase contracts (D7), and the same-session
  map fallback means the failure only reappears in the
  cross-process case the fix targets.
- **Wide prose surface.** Editing five large command files
  risks collateral phrasing changes. Mitigations: minimal,
  patterned edits per file; phrase assertions verified;
  scaffold mirrors regenerated identically; drift tests.
- **Line-number churn.** Site labels in
  `golden-output-shape.test.ts` and comments elsewhere become
  stale after edits; refreshed in the same increment.
- **Contract test coupling.** `command_contract_test.go`
  asserts exact phrases; new assertions must track the final
  prose wording chosen during implementation (tasks.md makes
  this explicit so the wording and assertion land together).
