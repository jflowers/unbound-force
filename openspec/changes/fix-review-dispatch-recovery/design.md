<!-- change: fix-review-dispatch-recovery
     originating_issue: 751 -->

## Context

Issue #751: a `/uf.review-council` spec-review dispatch became
permanently unfinalizable. The divisor-guard child completed its
review (6 findings + 1 lesson proposal accepted, final response
begun), then its session aborted at the ~363k-token context
ceiling. The run was recorded `failed` while its accepted
submissions persisted; `consolidate_dispatch` folded them into the
payload; the finalizer correctly rejected it three times
(`non-success run must not vote or emit findings`) per RD-FR-007.
Retry cannot help because the on-disk dispatch state never
changes. Three successful reviews were stranded INCONCLUSIVE.

Failure chain in the code (`.opencode/plugins/review-dispatch/
index.ts`, one 4730-line plugin file):

1. Submit tools (`createSubmitReviewFindingsTool` line 2930,
   `createSubmitLessonProposalTool` line 2958) accept submissions
   regardless of the run's eventual terminal status.
2. `dispatchAgentRun` (2699-2921) harvests the submission store
   into `run-<agent>.json` including for failed runs.
3. `consolidate_dispatch` (3183-3345) reads ALL run files:
   `collectedProposals = runs.flatMap(...)`, `deduplicateFindings(
   runs)` (2999-3026), and `dispatchRuns[].findings` copied for
   every run regardless of status.
4. The finalizer's `validateRunState`/`validateFindings`
   (2056-2270) refuses non-success contributors - correct.
5. No sanctioned recovery: no exclusion, no discard, no partial
   re-dispatch; `sessionCorrelationMap` (line 571) is in-process,
   so even a fixed consolidator cannot find the dispatch session
   from a fresh parent session.

Detection signal: `.opencode/lib/agent-executor.ts` line 384 - a
child that aborts mid-message returns `status: "failed"`, `error.
code: "child_message_error"`, while partial `text` and `usage`
are still captured and returned. Combined with harvested
submissions, the guard case is precisely identifiable.

## Goals / Non-Goals

### Goals

- A dispatch with >= 1 successful run MUST remain finalizable no
  matter what its failed children did (RD-FR-025).
- A child that submitted structured output and entered its final
  response MUST NOT be bricked by a post-submission abort
  (RD-FR-026).
- Explicit, auditable recovery operations for already-bricked
  dispatches: discard orphaned submissions, partially re-dispatch
  failed reviewers (DR-FR-001..003).
- Cross-session recovery: tools resolve the dispatch session by
  explicit correlation id, not only via in-process state.
- Per-run token usage visible in `dispatch_status` (RD-FR-027).

### Non-Goals

- Trimming child prompts or capping per-child token budgets
  (issue direction 4) - documented follow-up, not implemented.
- Changing finalizer validation, RD-FR-007 semantics, verdict
  computation, or artifact schema versions.
- Any Go code change (plugin is TypeScript; `make plugin-test`).
- Multi-run-per-plan-entry support (finalizer keeps rejecting
  duplicate runs per entry; re-dispatch replaces instead).

## Decisions

### D1: Success-scope at consolidation, not at harvest

`dispatchAgentRun` keeps harvesting all submissions into the run
file (audit trail, input to D2 reclassification). The filter
lives in `consolidate_dispatch`, the single choke point before
the finalizer: `collectedProposals`, `deduplicateFindings` input,
and `dispatchRuns[].findings` derive from `status === "success"`
runs only; non-success runs emit empty findings arrays in the
payload. The consolidate result gains a machine-readable
`warnings` array (`orphaned_submissions_excluded` entries with
agent, run_id, findings/proposals counts). Zero-success keeps the
RD-FR-007 fail-closed path. Finalizer code is untouched.

### D2: Post-submission completion reclassification

In `dispatchAgentRun`, after harvest: reclassify to `success`
when `result.status === "failed"` AND `result.error?.code ===
"child_message_error"` AND harvested findings/proposals exist AND
`result.text` is non-empty. Runs failing earlier, timing out,
cancelled, or model-mismatched stay `failed` (spec scenarios).
Abort circumstances are preserved: `PersistedRunData` gains an
optional audit field (e.g. `post_submission_abort`) recorded in
the run file; the finalization-payload run emits `error: null`
unless implementation verification proves `validateRunState`
tolerates errors on success runs (verify first; the null-error
fallback is the safe default). `workflow_verdict` stays null at
dispatch time as today.

### D3: Explicit correlation id resolution

`consolidate_dispatch` and `dispatch_status` accept an optional
`correlation_id` parameter, falling back to `sessionCorrelationMap`
when omitted. This unblocks recovery of already-bricked dispatches
from a fresh parent session (the #751 case) and makes each tool
usable standalone - Constitution II (Composability First).

### D4: Recovery tools in the same plugin

- `discard_orphaned_submissions(correlation_id, agents?)`:
  rewrites non-success run files with emptied findings/proposals
  plus a `discarded_submissions` audit block (agent, run_id,
  counts, timestamp). Refuses successful runs. Returns a
  machine-readable summary.
- `redispatch_failed_runs(correlation_id, agents?, timeout?)`:
  re-runs only failed reviewers in the same dispatch session,
  reusing the original plan entry, model resolution, and prompt.
  Requires the prompt: `dispatchAgentRun` persists the prompt in
  the run record from now on. Prior run files are moved to a
  `superseded/` subdir (outside the `run-*.json` glob, so plan
  validation still sees exactly one run per entry) before the new
  run file is written. Core dispatch logic is extracted into a
  shared internal `executeDispatchRun()` used by both
  `dispatch_agent_run` and the recovery tool.

### D5: Refresh session metadata on every call

`dispatchAgentRun` persists `session-metadata.json` whenever
`session_metadata` is supplied, not only on the first call per
parent session. Durable fix for the stale-plan rejection
documented in learning review-dispatch-20261017T234909;
same-entry re-dispatch is unaffected (plan unchanged).

### D6: Token usage in dispatch_status

Verify the `dispatch_status` output includes each run's
`usage` (already in `PersistedRunData`); add it if missing. No
effect on status or verdict computation.

### Constitution alignment (from proposal)

- **I. Autonomous Collaboration**: recovery operates on
  self-describing on-disk artifacts (run files, session metadata,
  audit blocks) via explicit correlation id - no runtime coupling
  to the original parent session.
- **II. Composability First**: D3/D4 make consolidation, discard,
  and re-dispatch usable standalone from any session.
- **III. Observable Quality**: every exclusion, discard, and
  replacement is a machine-readable warning or audit record with
  producer identity (run_id, agent, counts).
- **IV. Testability**: all logic is pure TypeScript over temp
  dirs + existing test exports; coverage strategy in tasks.md.
- **V. Security by Default**: no new dependencies; existing
  0o750/0o600 permission patterns preserved.
- **VI. Deterministic Execution**: recovery is extracted to
  executable tools with tests, not procedural prose in commands.

## Risks / Trade-offs

- **R1: Reclassification admits partial reviews.** A child that
  submitted findings then aborted mid-review counts as success.
  Accepted: submitted findings are explicitly chosen, Zod-validated
  output; verdict derives from findings, not prose. Criteria stay
  strict (submissions + final-phase text + child_message_error).
- **R2: Excluded findings lose signal.** #751's guard findings are
  dropped from the verdict when the run stays failed. Mitigated by
  D2 (legitimate completions recovered) and D4 (operator can
  redispatch); the warning keeps the loss visible.
- **R3: Success-run-with-error uncertainty.** `validateRunState`
  treatment of errors on success runs must be verified in code;
  the null-error + on-disk audit fallback avoids the question.
- **R4: Run-file overwrite on re-dispatch.** Superseded runs move
  to `superseded/` to preserve audit (DR-FR-003) while keeping the
  `run-*.json` glob at one file per agent.
- **R5: Tmp retention.** Dispatch dirs live under the OS tmpdir;
  recovery works only while those files persist. Documented
  limitation; unchanged by this change.
- **R6: Prompt persistence grows run files.** One bounded prompt
  per reviewer; acceptable for auditability and re-dispatch.
<!-- scaffolded by uf vdev -->
