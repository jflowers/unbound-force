## Context

Review-dispatch executes Divisor reviewer runs through a
shared executor (`.opencode/lib/agent-executor.ts`) whose
`DEFAULT_TIMEOUT_MILLISECONDS = 600_000` is a flat default:
every omitted timeout resolves to 600 s regardless of prompt
size, change profile, or parallel contention. The review
matrix (`.uf/review-matrix.yaml`) configures
`limits.per_run_timeout_seconds: 1200`, but that value is
prose-mediated — `plan_review_dispatch` surfaces it in plan
output for the orchestrating LLM to copy into
`dispatch_review_runs`'s `per_run_timeout_ms`, and execution
never reads it. `dispatch_review_runs` only forwards
`per_run_timeout_ms` when the LLM supplies it (index.ts
`if (input.per_run_timeout_ms !== undefined)`), and
`redispatch_failed_runs` resolves `input.timeout ??
DEFAULT_TIMEOUT_MILLISECONDS` — its tool description even
documents "the dispatch default (600_000 ms) applies",
contradicting the configured 1200 s.

The 2026-10-27/28 security-panel incident (issue #849) showed
both failure modes: 5 of 6 reviewers killed at exactly 600 s
under `max_parallel_runs: 4` contention with ~175 KB prompts;
then, during the sequential redispatch, the parent tool-call
window died ~21m20s in — `curator` was cancelled 7m57s into
its re-run after submitting findings (now orphaned), and two
remaining runs never executed. Because `redispatch_failed_runs`
refuses non-`failed` runs (DR-FR-002 targets
`run.status === "failed"` only), the cancelled run has no
re-run path; the only tool that touches its submissions is
`discard_orphaned_submissions` (DR-FR-001), which is data loss.

Work signals are already available at dispatch time: prompt
sizes (the built prompt files), change profile and mode
(session metadata), included-run count and `max_parallel_runs`
(dispatch input), and tier (per plan entry). Nothing uses
them.

This design covers the four fix-shape requirements from issue
#849: derivation (RD-FR-028), matrix wiring (RD-FR-029),
timeout provenance (RD-FR-030), and recoverable parent-window
cancellation (RD-FR-031 + the DR-FR-002 modification).

## Goals / Non-Goals

### Goals

- Per-run timeouts derived from the dispatched work via a
  deterministic pure function, with a contention multiplier
  for parallel batches, clamped to a configurable ceiling
  bounded by the existing 1_800_000 ms schema bound.
- The matrix `limits.per_run_timeout_seconds` (and optional
  per-tier overrides) wired into execution as the derivation
  base for `dispatch_review_runs` and
  `redispatch_failed_runs` when the timeout argument is
  omitted; explicit arguments still win.
- Timeout provenance (effective value + derivation inputs)
  persisted in every run record, following the established
  run-file-only optional audit record pattern.
- Machine-readable operation window records for every
  dispatch/redispatch invocation, with interrupted-operation
  detection (start without end) surfaced by `dispatch_status`.
- DR-FR-002 extended so cancelled runs are re-run targets,
  plus stranded-archive restoration for sessions whose
  recovery invocation was killed mid-flight.

### Non-Goals

- Changing the `dispatch_agent_run` direct-call default: the
  fix shape names `dispatch_review_runs` and
  `redispatch_failed_runs` only. `dispatch_review_runs`
  always sets an explicit derived timeout on its internal
  per-run calls, so the aggregate path never falls through to
  the flat default; direct single-run `dispatch_agent_run`
  calls keep explicit-arg-or-flat-default semantics.
- Modifying any review-limit value. The canonical
  `.uf/review-matrix.yaml` is untouched; new matrix fields are
  optional schema support only (see D6).
- Changing the `TimeoutSchema`/`validateTimeout` 1_800_000 ms
  bound or executor abort/cancel semantics.
- In-flight cancellation detection (heartbeats): interruption
  is inferred from operation records with a start and no end,
  which requires no cooperation from a killed process.
- Changing the `finalize_review_dispatch` payload schema:
  window records live in the dispatch session directory and
  are surfaced through `dispatch_status`.
- Changing command prose behavior: the
  `per_run_timeout_ms` guidance in `uf.review-council.md` et
  al. gets a documentation-only note that omission now
  derives from the matrix.

## Decisions

### D1: Derivation formula and coefficients

A pure function computes, per run:

```
derived = clamp(
  round((baseMs + promptTermMs + profileTermMs)
        × contentionMultiplier),
  floor   = baseMs,
  ceiling = min(configuredCeilingMs, 1_800_000)
)
```

Ceiling/floor precedence: the base floor wins over a
misconfigured ceiling — `effectiveCeilingMs = max(min(
configuredCeilingMs, 1_800_000), baseMs)`. A configured
ceiling below the resolved base window is raised to the base,
so the derivation never reduces a run below its base window.

- `baseMs` — per RD-FR-029: the per-tier override for the
  run's resolved tier when configured, else the scalar
  `limits.per_run_timeout_seconds`, else the existing
  matrix-defaults fallback (600 s), × 1000.
- `promptTermMs` — `max(0, promptBytes − 64 KiB) × 1_500 ms
  per KiB` (named constants `PROMPT_FREE_BYTES = 65_536`,
  `MS_PER_KIB_ABOVE_FREE = 1_500`). Prompts at or below
  64 KiB add nothing; the ~175 KB incident prompts add
  ≈167 s.
- `profileTermMs` — tier additive: `lightweight +0`,
  `standard +120_000`, `heavy +300_000`, and `0` for a
  tier-less (direct-model) plan entry. The plan entry's
  resolved tier is the sole tier input; the session
  change-profile tier is recorded as provenance only and MUST
  NOT alter the term. Tier is the planner's own size/depth
  classification; diff volume is already carried by prompt
  bytes, so a lines-based term would double-count it.
- `contentionMultiplier` — `1 + 0.15 × (max_parallel_runs −
  1)`, capped at 1.5 (named constants). Applied only in
  `dispatch_review_runs` when the configured
  `max_parallel_runs` exceeds 1 (the configured concurrency
  cap, not observed concurrency); redispatch re-runs execute
  sequentially and MUST NOT apply it (RD-FR-028).

Calibration: the incident panel (6 reviewers, 4-parallel,
~175 KB prompts, standard/heavy tiers, 1200 s base) derives
1487–1667 s before contention; ×1.45 → 2156–2417 s, clamped
to the 1800 s ceiling — 3× the 600 s that killed the original
panel, and matching the 1800 s budget the DR-FR-002 learning
(observed 2026-10-23) used for a successful large-diff re-run.
Sequential redispatch derives 1487–1667 s with no multiplier,
comfortably above the 477 s at which `curator` was cancelled.

Coefficients are named constants in one module — deliberately
NOT matrix-configurable in this change. Only the ceiling and
per-tier base overrides are configurable (D6), keeping the
new config surface minimal. Every derivation input is
recorded per run (D5), so recalibration is evidence-driven.

Rationale per Constitution II/IV: a pure function of scalar
inputs, no I/O, no clock — trivially unit-testable and usable
standalone by any tool.

### D2: Resolution precedence

1. Explicit `per_run_timeout_ms` (`dispatch_review_runs`) or
   `timeout` (`redispatch_failed_runs`) wins outright.
2. Otherwise the derived value from D1.

`dispatch_review_runs` computes the derivation per plan entry
(tiers differ across entries via `always` overrides, e.g.
`divisor-adversary: heavy`) after prompts are built, using
the persisted prompt file's byte size, and passes the result
as the explicit per-run `timeout` on its internal calls — so
the internal `dispatchAgentRun` path never falls through to
the flat default. `redispatch_failed_runs` derives once per
re-run from the persisted prompt's byte length plus the plan
entry's tier (`0` for tier-less entries); the session's
change profile is recorded as a provenance signal only.

### D3: Formula location — new `.opencode/lib/run-timeout.ts`

The derivation lives in a new shared lib module as
`derivePerRunTimeoutMs(signals)` returning
`{ effectiveMs, provenance }`. Single source of truth for
both tools (mirroring how `resolvePlanEntryRuntime` is shared
so dispatch and redispatch cannot drift). The plugin imports
it; `agent-executor.ts` is untouched — its
`TimeoutSchema` bound and executor semantics are preserved
verbatim.

### D4: `per_run_timeout_ms` schema alignment

`dispatch_review_runs`'s `per_run_timeout_ms` is currently
`z.number().int().positive().optional()` with no upper bound,
unlike every other timeout input (`TimeoutSchema` caps at
1_800_000). Align it to the shared `TimeoutSchema` semantics
(positive int ≤ 1_800_000) and update the description text.
This tightens input validation; it does not weaken any gate.

### D5: Timeout provenance record (run-file only)

`PersistedRunData` gains an optional `timeout` field:

```json
{
  "effective_ms": 1800000,
  "source": "derived",
  "base_ms": 1200000,
  "prompt_bytes": 179200,
  "prompt_term_ms": 166500,
  "profile_term_ms": 300000,
  "resolved_tier": "heavy",
  "session_profile_tier": "standard",
  "contention_multiplier": 1.45,
  "max_parallel_runs": 4,
  "ceiling_ms": 1800000,
  "clamped": true
}
```

`source` is `"explicit"` or `"derived"`. `resolved_tier` is
the plan entry's resolved tier (`null` for a tier-less
direct-model run) and `session_profile_tier` is the session
change-profile tier recorded as a provenance signal only.
Together they carry the tier signals RD-FR-030 names: a
`lightweight` run (zero term, tier present) is
distinguishable from a tier-less run (zero term, `null`
tier) without inferring from computed terms. This follows
the established run-file-only optional audit record pattern
(`prompt`, `post_submission_abort`,
`discarded_submissions`): older run files without the field
remain valid, the strict `DispatchRunSchema` consolidate
mapping deliberately omits it, and `dispatch_status` SHOULD
surface `effective_ms` per run when present (RD-FR-030).

### D6: Matrix schema additions (additive, optional)

`LimitsSchema` gains two optional fields, each
`z.number().int().min(30).max(1800).optional()`:

- `per_run_timeout_ceiling_seconds` — derivation ceiling;
  defaults to 1800 (the schema bound) when absent.
- `per_run_timeout_tiers` — optional
  `{lightweight?, standard?, heavy?}` per-tier base-window
  overrides; an override for the run's resolved tier wins
  over the scalar limit (RD-FR-029).

The canonical `.uf/review-matrix.yaml` is NOT modified: no
new keys, no value changes. Setting values for the new fields
in the canonical matrix would be a review-limit change
requiring documented maintainer authorization per the D11
precedent (unleash-deterministic-tools); this change adds
schema support and code defaults only. The scaffold mirror
stays in sync by being equally untouched, so drift detection
is unaffected.

Gatekeeping analysis: this change modifies no limit value. It
raises the effective omitted-argument floor from 600 s to the
configured 1200 s — strengthening enforcement of the
D11-authorized value — and caps derivation at the pre-existing
1_800_000 ms schema bound. Per Constitution III, every
effective value carries provenance.

### D7: Operation window records

Each `dispatch_review_runs` / `redispatch_failed_runs`
invocation writes `operation-<uuid>.json` into the dispatch
session directory via the established write-temp-then-rename
pattern:

- At invocation start: `{ kind: "dispatch" | "redispatch",
  operation_id, started_at }`.
- On settle: completed with `completed_at`, terminal state,
  and run counts (completed/failed/skipped for dispatches;
  redispatched/refused/restored for recoveries).

A record with `started_at` and no `completed_at` denotes an
interrupted operation (parent tool-call window death) — the
killed process cannot write its end, which is exactly the
signal. `dispatch_status` reads all `operation-*.json`,
reports each operation's window, and flags interrupted ones
(RD-FR-031). Per-operation files avoid append-file
concurrency; UUID names avoid timestamp collisions. The
`run-*.json` discovery glob is unaffected.

### D8: DR-FR-002 extension semantics

- Target predicate widens from `run.status === "failed"` to
  `run.status === "failed" || run.status === "cancelled"`
  for both the omitted-agents default and the named-filter
  path. Cancelled runs are infra failures: they reuse the
  persisted prompt and original plan entry exactly like
  failed runs, archive-first replacement applies, and the
  prior cancelled record (with its harvested submissions)
  remains archived for audit.
- Refusal semantics: a named run whose status is neither
  `failed` nor `cancelled` (e.g. `success`, `skipped`,
  `budget_skipped`, `limit_skipped`) is still refused per
  run. Tool description and refusal reason text update to
  "only failed and cancelled runs are redispatch targets".
- Stranded-archive restoration: when loading a session, any
  `superseded/run-<agent>-<run_id>.json` whose agent has no
  active `run-<agent>.json` is restored to the active path
  BEFORE target resolution (most recent by file mtime when
  several exist). This recovers sessions stranded by a
  recovery invocation killed between the archive-first rename
  and its replacement write — the "never executed" state from
  the incident. Restores are counted in the operation record
  and reported in the output. Archives whose plan entry HAS
  an active run file are untouched (normal post-redispatch
  state).
- DR-FR-003 safety invariants are untouched: recovery still
  alters no finalizer rules, fabricates nothing, and cannot
  produce an approving result from zero successful runs.

### Constitution alignment (referenced from proposal)

- **Autonomous Collaboration (I)**: operation window records
  and timeout provenance extend the existing self-describing
  artifact set; recovery stays artifact-driven.
- **Composability First (II)**: the derivation is a pure
  standalone lib function; every tool remains independently
  usable; matrix additions are optional with defaults.
- **Observable Quality (III)**: effective timeouts carry
  derivation provenance; interrupted operations are
  machine-detectable; postmortems need no timestamp
  inference.
- **Testability (IV)**: pure function + injectable
  filesystem patterns; no external services.
- **Security by Default (V)**: no secrets/auth surface;
  optional matrix fields carry safe defaults; D4 tightens
  `per_run_timeout_ms` validation to `TimeoutSchema`
  semantics.
- **Deterministic Execution (VI)**: timeout selection
  becomes a deterministic pure function with machine-readable
  provenance, replacing LLM-mediated argument copying.

## Risks / Trade-offs

- **Longer runs before failure**: derived timeouts can be up
  to 3× today's effective default, so a genuinely hung
  reviewer occupies more wall-clock. Accepted: the timeout is
  a safety bound, not a cost control; the existing
  `budget_usd` checks between batches and the per-run schema
  ceiling bound exposure. The incident evidence shows
  under-provisioning (not over-provisioning) destroys
  reviews.
- **Heuristic coefficients**: the D1 constants are calibrated
  from two incidents and may mis-provision for unseen shapes.
  Mitigation: every derivation input is persisted per run
  (D5), coefficients live in one module, and explicit
  arguments override everything.
- **Ceiling saturation**: very large panels will clamp at
  1800 s, where precision beyond "the schema maximum"
  matters little; raising the schema bound is a separate
  gate decision, out of scope.
- **Cancellation loops**: re-runnable cancelled runs could
  mask a systematically dying parent window. Mitigation:
  operation window records make repeated interruption visible
  in `dispatch_status`, and RD-FR-025 exclusion still governs
  runs that never succeed.
- **mtime-based restore ordering** is filesystem-dependent;
  the worst case restores an older archive of the same plan
  entry — still a valid prior record, and the session returns
  to a consolidatable state either way.
- **Compatibility**: older run files (no `timeout` field) and
  older sessions (no `operation-*.json`) remain valid;
  `dispatch_status` simply reports no window information for
  them. No migration is required.
