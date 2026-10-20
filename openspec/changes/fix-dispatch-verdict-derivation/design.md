## Context

`consolidate_dispatch` (.opencode/plugins/review-dispatch/index.ts)
builds the final review payload whose top-level `workflow_result.value`
and `verdict` are derived from consolidated finding severities:

- L3246: `computeVerdict(consolidatedFindings)` produces a
  severity-ladder verdict (CRITICAL/HIGH -> REQUEST CHANGES,
  MEDIUM/LOW -> APPROVE WITH ADVISORIES, none -> APPROVE).
- L3288: `workflowResult = { kind, value:
  workflowVerdictValue(kind, verdict) }` projects that
  severity-derived verdict into the workflow-native space.

`finalize_review_dispatch` then validates the payload
semantically. `validatePayloadSemantics` (L2277-2295) recomputes
the expected value with `calculatedWorkflowValue` (L1957-1975),
which derives it from per-run workflow verdicts of successful
runs (persona-collapsed, strictest-rule / majority semantics) --
not from finding severities.

The two derivations disagree whenever the panel is split:

- Feedback mode: emission says AUTHOR-DECIDES whenever any
  finding exists; validation expects ACCEPT whenever any
  successful run voted ACCEPT (a zero-findings run). A split
  panel satisfies both predicates and can therefore never
  finalize. Mechanical retries (max 2) cannot succeed; the
  workflow fails closed to INCONCLUSIVE with no artifact
  (issue #764, observed twice on PR #761).
- Triage mode: emission is severity-derived INVALID while
  validation expects the persona majority (triageMajority).
- Council and test-review modes are immune: the strictest
  persona vote equals the severity ladder over the union of
  successful runs' findings, and L1971 reconciles mixed panels
  through the advisories term.

The prior change `dispatch-finalize-determinism` fixed the same
class of contradiction at the per-run layer (L3270). This change
fixes the remaining top-level layer.

## Goals / Non-Goals

### Goals

- `consolidate_dispatch` and `finalize_review_dispatch` derive
  `workflow_result.value` from the same function, so any payload
  the emitter builds passes the emitter-side copy of semantic
  validation by construction.
- Feedback split panels (zero-findings ACCEPT run plus
  findings-bearing AUTHOR-DECIDES runs) finalize successfully.
- Triage split-majority panels derive the persona-majority
  value instead of the severity-derived value.
- Council and test-review outputs remain byte-identical.
- Regression tests reproduce the issue #764 panel shapes.
- The scaffold mirror
  (internal/scaffold/assets/opencode/plugins/review-dispatch/
  index.ts) receives the identical edit; drift tests keep
  holding.

### Non-Goals

- Issue #751 (failed-run findings contaminating
  `deduplicateFindings`, L2999-3024 -- no status filter). Vote
  based derivation is immune (votes come only from successful
  runs); the findings-union validation behavior is unchanged.
- Issues #746/#760 (dispatch session collision, correlation
  reuse), #763 (docs), #717 (docs).
- Changing `finalize_review_dispatch` semantics, the command
  specs (uf.address-feedback.md SS2.3.5), or the per-kind
  verdict enums.
- Changing per-run `workflow_verdict` emission (L3270, already
  correct).

## Decisions

### D1. Fix at the emission point (issue direction 1)

Derive `workflow_result.value` in `consolidate_dispatch` from
`calculatedWorkflowValue` -- the exact function the finalizer
uses -- instead of projecting `computeVerdict` output. Keep
`computeVerdict` for `verdict_reason` and advisory content.

Rationale: relaxing the finalizer (direction 2) would change
documented command-spec rules and the per-kind enum contracts
pinned by finalize-error-boundaries.test.ts. This mirrors the
dispatch-finalize-determinism philosophy: fix the emitter, not
the validator. Constitution: Observable Quality (III) -- the
machine-parseable verdict becomes consistent across emission
and validation; Testability (IV) -- one derivation function,
testable in isolation.

### D2. Narrow `calculatedWorkflowValue` to a structural input

Change the signature from the full payload to a structural
type carrying exactly what the function reads:

    { runs, workflow_result: { kind }, advisories }

The full payload satisfies this structurally, so the finalizer
call site (L2286) is unchanged. `consolidate_dispatch` calls it
before the payload exists, with the built `dispatchRuns`, the
resolved `kind`, and `advisories: []`.

Rationale: a Pick-like structural type prevents the two call
sites from drifting and avoids assembling a throwaway
provisional payload. Constitution: Composability First (II) --
no tool interface changes; Autonomous Collaboration (I) -- the
contract stays artifact-mediated.

### D3. Advisories ordering is a proven fixed point

The only apparent circularity is the council branch's
`advisories.length > 0` term (L1971): advisories depend on the
projected verdict, which depends on the value. Resolution:

1. Compute `value` from votes with `advisories: []`.
2. `verdict = projectNativeValue(value)`; advisories are built
   only when the verdict is APPROVE WITH ADVISORIES.

Whenever the final advisories are non-empty (council: an AWA
vote exists; feedback: AUTHOR-DECIDES value), the votes already
independently produce that value, so the finalizer's
recomputation with the real advisories returns the same value.
When all votes are APPROVE, advisories are empty and the term is
a no-op. The L1971 term remains as a guard for externally
constructed payloads; it cannot fire for emitted ones.

Feedback consequence: a split panel finalizes with value
ACCEPT / verdict APPROVE and `advisories: []`; the findings
remain in `payload.findings` and `verdict_reason`. This is
correct -- ACCEPT means the author decides, and the findings
are the decision input.

### D4. Zero-successful-runs panels finalize cleanly

With no successful runs, `calculatedWorkflowValue` returns
`noSuccessResult(runs)` (INCONCLUSIVE, or UNAVAILABLE when all
runs failed with availability errors). `projectNativeValue`
passes both through, and both are members of the verdict enum,
so such payloads now validate instead of being rejected for a
value mismatch. `verdict_reason` stays `computeVerdict`-derived
("No findings requiring changes") -- an accepted cosmetic quirk
on panels that previously produced no artifact at all.

### D5. Single fix site, mirrored

The only behavioral edit is the L3286-3289 block in
`createConsolidateDispatchTool`; the identical edit is applied
to the scaffold mirror asset. Grep-verified usage: `computeVerdict`
(def L3031, call L3246) and `workflowVerdictValue` (L3270
per-run -- keep; L3288 top-level -- replace) have no other call
sites.

## Risks / Trade-offs

- **Verdict semantics change** for previously-unfinalizable
  panels (feedback split, triage split-majority, zero-success
  runs). These panels never produced an artifact before, so no
  downstream consumer observed the old values; the change is
  strictly an availability improvement.
- **Council/test-review byte-identity** rests on the strictest
  persona vote equaling the severity ladder over the union of
  successful runs' findings. This holds because per-run votes
  are themselves severity-derived (L3270) and the ladder is
  monotone under union. Existing council tests (L211-L515) and
  a new mixed-severity council panel guard it.
- **`verdict_reason` may disagree with the vote-derived
  verdict** on contaminated panels (failed-run findings in
  `deduplicateFindings`). That is issue #751's domain and is
  unchanged by this fix; the reason string is advisory content,
  not a validated field.
- **Structural signature** relies on TypeScript structural
  typing; the finalizer call site keeps compiling unchanged,
  verified by `make plugin-test` and `make check`.
