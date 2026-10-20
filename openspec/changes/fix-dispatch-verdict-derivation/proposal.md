## Why

`consolidate_dispatch` and `finalize_review_dispatch` disagree about
how a dispatch verdict is derived, and the disagreement is
deterministic — so affected dispatches can never finalize.

- Emission (`.opencode/plugins/review-dispatch/index.ts:3288`):
  `consolidate_dispatch` derives the top-level
  `workflow_result.value` from `computeVerdict(consolidatedFindings)`
  — a severity ladder over ALL consolidated findings — then projects
  it per kind via `workflowVerdictValue`.
- Validation (`index.ts:2286`): `finalize_review_dispatch` (and the
  internal-finalize path inside `consolidate_dispatch` itself)
  recomputes the expected value with `calculatedWorkflowValue` — a
  vote-based rule over per-run, kind-native verdicts.

For feedback dispatches these rules are structurally contradictory
on any split panel: a panel where at least one successful run
submits zero findings (run verdict `ACCEPT`) while any other run
submits findings. Emission says `AUTHOR-DECIDES` whenever any
finding exists; validation demands `ACCEPT` whenever any successful
run voted `ACCEPT`. Both conditions hold simultaneously on a normal
panel shape (one reviewer fully accepts an item while others
document findings and defer to the author).

Observed in a real `/uf.address-feedback` run on PR #761 (session
`ses_eaa447110ffekZFgHcee30mmef`, 2026-10-19): two Tier 2 items,
each with 4/4 successful runs, were rejected three times each
(initial + two identical mechanical retries) with
`workflow_result.value is AUTHOR-DECIDES; expected ACCEPT` and
`verdict is APPROVE WITH ADVISORIES; expected APPROVE`. Because the
inputs are persisted and the derivation deterministic, the
identical-retry budget can never succeed; both items fail-closed
`INCONCLUSIVE` with no persisted artifact despite fully successful
dispatches. Issue #764.

Triage mode carries the same structural mismatch (severity-derived
payload value vs `triageMajority` of persona votes) and is expected
to fail the same way on split-majority panels; the fix verifies and
covers it. Council and test-review kinds are immune: their per-run
severity ladder reproduces the consolidated severity ladder, so
both derivations agree on every input.

A prior change (`openspec/changes/dispatch-finalize-determinism`)
fixed the per-run verdict layer of this pipeline (kind-native run
verdicts). This change fixes the remaining top-level layer.

## What Changes

- `consolidate_dispatch` derives `payload.workflow_result.value`
  and `payload.verdict` from `calculatedWorkflowValue` — the same
  vote-based function the finalizer validates against — instead of
  the severity ladder. One derivation, used by both emission and
  validation, makes disagreement structurally impossible.
- `computeVerdict` is retained for `verdict_reason` and advisory
  content (severity-aware human context), not for the verdict.
- The finalizer, its validation rules, and the command specs are
  unchanged: the strictest-rule semantics documented in
  `uf.address-feedback.md` §2.3.5 remain authoritative.
- Regression tests pin the previously unfinalizable shapes:
  feedback split panel (one zero-findings run + findings-bearing
  runs) and triage split-majority panel, both through the
  internal-finalize path.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `dispatch-finalization` (capability created by the in-flight
  `dispatch-finalize-determinism` change; this change adds
  FR-009 through FR-012 to it and MUST archive after it): the
  consolidated payload's `workflow_result.value` and `verdict`
  are derived from per-run persona votes
  (`calculatedWorkflowValue`) rather than consolidated finding
  severities; `verdict_reason` and advisories remain
  severity-derived. Scaffold Asset Parity is not restated --
  the capability's existing FR-005 governs the mirror edit.

### Removed Capabilities

(none)

## Impact

- `.opencode/plugins/review-dispatch/index.ts` — payload
  construction in `createConsolidateDispatchTool`.
- `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
  — mirrored edit (drift-detection tests enforce equality).
- `.opencode/test/consolidate-dispatch.test.ts` — split-panel
  regression tests for feedback and triage internal finalization.
- Callers (`/uf.address-feedback`, `/uf.triage-issue`) need no
  changes: they already treat the finalization result as
  authoritative, and the command-spec rules are now actually
  satisfiable.
- Verdict semantics change only for previously-unfinalizable
  panels: feedback split panels now finalize as `ACCEPT`/`APPROVE`
  (per the documented strictest rule), and triage split-majority
  panels as the persona majority. Council and test-review outputs
  are byte-identical to today (both derivations agree there).
- Out of scope, tracked separately: #751 (failed runs with accepted
  submissions contaminating consolidated findings — a findings
  validation defect, not verdict derivation), #746/#760 (dispatch
  session collision), #763 (`diff_path` documentation).

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The dispatch artifact is the collaboration contract, and this
change makes its verdict self-consistent: the tool that emits the
payload and the tool that validates it share one derivation
function. Agents stop burning mechanical-retry budgets on
reconstruction attempts that are structurally doomed, and the
artifact persists on first finalization.

### II. Composability First

**Assessment**: PASS

Each plugin tool remains independently usable. The fix adds no
dependencies and no new tools; `consolidate_dispatch` without
provenance still returns a finalization-ready payload that a caller
may submit to `finalize_review_dispatch` unchanged.

### III. Observable Quality

**Assessment**: PASS

The persisted artifact keeps full provenance, per-run kind-native
verdicts, deduplicated findings, and a severity-aware
`verdict_reason`. The verdict itself now carries the vote-based
semantics the command specs document, so the artifact's meaning
matches its published contract.

### IV. Testability

**Assessment**: PASS

The defect is a pure function divergence reproducible from
persisted fixtures; the regression tests exercise the
internal-finalize path end-to-end with on-disk session fixtures,
no external services, following the existing
`consolidate-dispatch.test.ts` patterns.
