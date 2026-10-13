## Context

The review-dispatch plugin (`.opencode/plugins/review-dispatch/index.ts`)
owns the Divisor dispatch pipeline: planning, child-run execution,
consolidation, and finalization. Two layers disagree about the enum
space of run-level `workflow_verdict`:

- `runVerdict()` (~line 3068) derives each successful run's verdict
  from its findings severity and always returns a **generic** value
  (`APPROVE`, `APPROVE WITH ADVISORIES`, `REQUEST CHANGES`).
- `allowedRunVerdicts()` (~line 2128), used by finalizer semantic
  validation, requires **workflow-native** values: triage
  `VALID`/`INVALID`/`NEEDS-CLARIFICATION`, feedback
  `ACCEPT`/`AUTHOR-DECIDES`.
- `workflowVerdictValue()` (~line 3099) already maps generic to
  native, but is applied only to the top-level
  `workflow_result.value` (~line 3273), never to runs.

Consequently `consolidate_dispatch` emits run verdicts its own
finalizer rejects in triage and feedback modes — including the
internal-finalize path (provenance, ~line 3298), which runs the
same `validatePayloadSemantics` → `validatePlanAndRuns` chain. The
incident session (ses_eca4843f9ffeKwVLQhSFCRh2Rl) additionally
showed the commands steering agents into manual ~23 KB payload
reconstruction, where a plan-entry field (`read_only`) leaked into
run objects and the enum mismatch had to be reverse-engineered.
The provenance path's only test (consolidate-dispatch.test.ts:462)
covers council mode, where the mismatch is invisible.

## Goals / Non-Goals

### Goals
- Make `consolidate_dispatch` → finalizer round-trips valid in
  every mode without agent-side transformation.
- Make command finalization a deterministic single tool call.
- Give agents an explicit, bounded policy for mechanical finalizer
  rejections versus fail-closed outcomes.
- Fix the two ingest defects observed in the incident session
  (gh `--slurp` incompatibility, missing duplicate-search
  fallback).
- Keep `.opencode/` and `internal/scaffold/assets/` copies
  byte-identical.

### Non-Goals
- Changing verdict semantics, majority rules, findings
  consolidation, severity definitions, or any governance gate.
- Changing the finalizer's native-verdict validation contract
  (relaxing `allowedRunVerdicts()` instead would weaken the
  per-kind enum discipline).
- Persisting the child's textual triage verdict as the run-level
  `workflow_verdict` (runs keep the findings-derived projection;
  persona assessments remain in prompts/parsing and the legacy
  artifact).
- Syncing consumer repositories (fullsend-ai/agents et al.) —
  deferred to a later `uf init` sync.
- Modifying dispatch limits, budgets, or model tiers.

## Decisions

1. **Fix at the emission point, not the validator.** In
   `createConsolidateDispatchTool`, hoist
   `const kind = workflowKind(sessionMetadata.command)` above the
   run-building block and emit
   `workflow_verdict: run.status === "success" ?
   workflowVerdictValue(kind, runVerdict(run.findings)) : null`.
   This reuses the existing lossless projection, is the identity
   for council/test-review (no behavior change there), and makes
   both the returned payload and the internal-finalize path
   validation-clean. The alternative — relaxing
   `allowedRunVerdicts()` — was rejected because the per-kind
   enum is a deliberate contract (finalize-error-boundaries.test.ts
   pins its rejection behavior).

2. **Commands finalize via `consolidate_dispatch` + provenance.**
   The three command sections (uf.triage-issue.md §4.6,
   uf.review-council.md §5, uf.address-feedback.md §2.3.8) are
   rewritten to: run `git branch --show-current` and
   `git rev-parse HEAD`, call `consolidate_dispatch` once with
   `{branch, commit, workflow_id: "uf.<command>"}`, and treat the
   returned finalization result as authoritative. In detached
   HEAD state (common in CI), `git branch --show-current`
   returns empty output; the command MUST fail closed with an
   explicit error rather than fabricate or omit the branch,
   requiring an explicit branch checkout or resolution before
   finalization. Manual payload
   assembly instructions, the `verdict_reason` enrichment
   requirement (action completion moves to the terminal report and
   legacy artifacts), and restated field lists are removed. The
   native↔generic↔canonical mapping tables remain for display
   only. This aligns with Autonomous Collaboration: the
   self-describing artifact is produced by the tool, not retyped
   by an agent.

3. **Bounded retry carve-out in the failure policy.** The commands
   distinguish mechanical shape rejections (correct and retry, at
   most twice, never altering assessment data) from persistence or
   content failures (fail closed to `INCONCLUSIVE`, human review).
   This removes the incident's unbounded deliberation while
   preserving fail-closed semantics for real failures.

4. **Regression tests mirror the incident.** Extend
   `.opencode/test/` with triage-kind and feedback-kind
   internal-finalize cases following the council-only pattern at
   consolidate-dispatch.test.ts:462: a persisted session whose
   metadata command maps to the kind, one run with LOW findings
   (expecting native run verdicts and `status: "success"`), and a
   payload-without-provenance case asserting the returned runs are
   finalizer-valid as-is.

5. **Ingest fixes are documentation-only.** §1.1 swaps the
   `--slurp` construct for
   `gh api --paginate ... --jq '.[] | {id, created_at, body}'`
   (verified working on the installed gh); §1.4 adds the
   zero-result fallback search with the top 2-3 title keywords.
   Composability First: no new tooling — both reuse existing `gh`
   surface.

## Risks / Trade-offs

- **Kind-mapping changes emitted payloads.** Callers that parsed
  run-level verdicts from `consolidate_dispatch` output in triage
  or feedback mode will now see native values. This is the
  intended contract alignment; the commands are updated in the
  same change, and no other consumer exists in-repo.
- **Command simplification removes agent latitude.** Agents can no
  longer enrich `verdict_reason`. Accepted: action outcomes are
  already persisted in the legacy artifact and terminal report;
  `verdict_reason` stays tool-computed and reproducible
  (Observable Quality).
- **Two copies of every edited file.** Mitigated by task ordering
  (mirror each edit immediately) and a parity check plus
  `make build` / `make plugin-test` in the verification group.
- **Test scope.** Only the consolidation/finalization boundary is
  regression-tested; broader dispatch-matrix coverage is unchanged
  and out of scope.
