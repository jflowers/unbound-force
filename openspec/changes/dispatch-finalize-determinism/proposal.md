## Why

A production `/uf.triage-issue` run (session
`ses_eca4843f9ffeKwVLQhSFCRh2Rl`, 2026-10-13, issue #1670 in
fullsend-ai/agents) needed **three `finalize_review_dispatch`
attempts** — each a ~23 KB hand-assembled payload costing ~60 s and
a full LLM round-trip — before the dispatch could be finalized:

1. Attempt 1 rejected: `Unrecognized key: "read_only"` (the agent
   added a plan-entry field to run objects while manually
   reconstructing the payload).
2. Attempt 2 rejected: `run ... has a verdict outside triage` for
   all 7 runs. Root cause is a plugin contract mismatch:
   `consolidate_dispatch` derives run-level `workflow_verdict` in
   the **generic** enum space (`APPROVE`, `APPROVE WITH
   ADVISORIES`) from findings severity (`runVerdict()`), while the
   finalizer's `allowedRunVerdicts()` requires **native** verdicts
   for triage (`VALID`/`INVALID`/`NEEDS-CLARIFICATION`) and
   feedback (`ACCEPT`/`AUTHOR-DECIDES`). The internal-finalize
   path (`consolidate_dispatch` with `provenance`) runs the same
   validation, so it is equally broken for triage and feedback;
   only council mode works because generic verdicts are allowed
   there. The only test of the provenance path covers council.
3. Attempt 3 succeeded only because the agent reverse-engineered
   the generic→native mapping and hand-applied it to each run.

The commands amplify the problem: they mandate manual closed-
payload assembly, require enriching tool-computed `verdict_reason`
with action completion (pushing agents off the deterministic
one-call path), and their fail-closed rule treats a mechanical
shape error the same as a persistence failure, forcing long
deliberation about whether a retry is even permitted. Two smaller
defects also surfaced in the same session: the `gh api
--paginate --slurp` snippet in uf.triage-issue.md is incompatible
with `--jq` in the installed gh CLI, and the duplicate-keyword
search has no documented fallback when GitHub's implicit-AND
search returns zero results.

## What Changes

1. **Kind-aware run verdicts in the review-dispatch plugin**:
   `consolidate_dispatch` maps run-level `workflow_verdict` to the
   workflow-native enum via the existing `workflowVerdictValue()`
   before emitting runs (identity for council/test-review), so
   both the returned payload and the internal-finalize path pass
   finalizer validation in every mode.
2. **Regression tests** for triage-mode and feedback-kind
   internal-finalize with provenance, closing the council-only
   test gap.
3. **Command rewrites** (uf.triage-issue.md §4.6,
   uf.review-council.md §5, uf.address-feedback.md §2.3.8 —
   `.opencode/commands/` and scaffold-asset copies): replace
   manual closed-payload assembly with one `consolidate_dispatch`
   call carrying provenance; treat the finalization result as
   authoritative; never hand-build the payload or alter
   tool-computed verdict/`verdict_reason`/run counts; report
   action completion in the terminal report and legacy artifacts
   instead of `verdict_reason`; add a bounded retry carve-out
   (max 2) for mechanical payload-shape errors versus INCONCLUSIVE
   for persistence/content failures.
4. **Minor uf.triage-issue.md fixes**: portable comment-pagination
   snippet (drop `--slurp`), deterministic duplicate-search
   fallback (zero results → retry once with the top 2-3 title
   keywords).

## Capabilities

### New Capabilities
- `dispatch-finalization`: Deterministic single-call
  consolidation and finalization of Divisor review dispatches,
  including kind-native run verdicts, authoritative finalizer
  output, and bounded mechanical-error retry semantics.

### Modified Capabilities
- `review-council`: The finalize-every-iteration step changes
  from manual payload assembly to the one-call
  `consolidate_dispatch` + provenance path.

### Removed Capabilities
- None.

## Impact

- **Plugin**: `.opencode/plugins/review-dispatch/index.ts`
  (kind-aware run verdicts in `createConsolidateDispatchTool`);
  mirrored to
  `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
  (embed.FS sync via `make build`).
- **Tests**: `.opencode/test/` — triage and feedback
  internal-finalize regression coverage (`make plugin-test`).
- **Commands**: six file copies (three commands ×
  `.opencode/commands/` + scaffold assets).
- **Behavior**: no change to verdict semantics, findings
  consolidation, human-confirmation gates, GitHub mutations, or
  persisted artifact schema; only the path to a valid finalization
  becomes deterministic. No quality/governance gate is touched.
- **Docs**: CHANGELOG entry; documentation issue for the
  user-facing command behavior change.
- **Deferred**: syncing the scaffolded copies in consumer repos
  (e.g., fullsend-ai/agents) via `uf init`; handled separately.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The change strengthens artifact-based collaboration: finalization
remains a single tool-authoritative call producing the
self-describing `review-dispatch` artifact and canonical
review-verdict v2 projection. Commands stop asking agents to
hand-transcribe ~23 KB payloads between tools — the exact
agent-to-agent hand-off that failed in the incident session.

### II. Composability First

**Assessment**: PASS

The fix is internal to the existing review-dispatch plugin and
reuses the existing `workflowVerdictValue()` mapping; no new
dependency, tool, or service is introduced. Scaffold assets stay
byte-identical to their `.opencode/` counterparts, preserving the
`uf init` composition path.

### III. Observable Quality

**Assessment**: PASS

Machine-parseable outputs are unchanged in schema but far more
reproducible in practice: one deterministic finalize call instead
of three ad-hoc LLM reconstructions. Provenance (branch, commit,
workflow id, correlation UUID, per-run model data) is preserved
by the tool rather than retyped by an agent.

### IV. Testability

**Assessment**: PASS

The previously untested triage/feedback internal-finalize paths
gain direct regression tests with injectable filesystem/clock/UUID
dependencies; `make plugin-test` verifies the suite and
`make build` verifies embed.FS asset parity.

### V. Security by Default

**Assessment**: PASS

The change strengthens the fail-closed boundary of dispatch
finalization: retry classification is deterministic and
default-deny, indeterminate failures fail closed to
`INCONCLUSIVE`, and the no-alteration rule for assessment data
is enforced structurally by the one-call path. No new input
surfaces, secrets, file permissions, or privilege boundaries
are introduced.
