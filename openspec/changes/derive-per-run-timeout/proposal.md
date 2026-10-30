## Why

Review-dispatch per-run timeouts are a fixed 600 s default
regardless of how much work each reviewer is given, and the
configured limit never reaches execution. A security-sensitive
6-reviewer panel (2026-10-27/28, issue #849) demonstrated both
failure modes:

1. The original dispatch killed 5 of 6 reviewers at exactly
   600 s under `max_parallel_runs: 4` contention with ~175 KB
   prompts — the flat default ignored both the work size and
   the parallel contention.
2. The redispatch re-ran sequentially (fixing contention), but
   ~21m20s into the redispatch tool call the parent tool-call
   window died, killing all three remaining runs at the same
   instant: `curator` was cancelled 7m57s in after submitting
   findings (now orphaned), and two others never executed.

Root causes verified in code:

- Flat `DEFAULT_TIMEOUT_MILLISECONDS = 600_000` in
  `.opencode/lib/agent-executor.ts` — every omitted timeout
  resolves to 600 s.
- Parallel contention unaccounted — a run dispatched in a
  batch of `max_parallel_runs > 1` shares provider throughput
  but receives the same window as an isolated run.
- `.uf/review-matrix.yaml`
  `limits.per_run_timeout_seconds: 1200` is prose-mediated: it
  surfaces in `plan_review_dispatch` output for the
  orchestrating LLM to copy into `per_run_timeout_ms`, and is
  never wired into execution. When the orchestrator omits the
  argument (as observed), the 600 s default applies — the
  configured limit never reaches execution.
  `redispatch_failed_runs` even documents "the dispatch default
  (600_000 ms) applies", contradicting the configured 1200 s.
- Work signals (prompt file sizes, change profile,
  included-run count, max_parallel_runs, mode) are available
  at dispatch time but unused.
- Parent-window cancellation is unrecoverable:
  `redispatch_failed_runs` (DR-FR-002) refuses non-`failed`
  runs, so parent-killed (`cancelled`) runs have no re-run
  path, and the only tool that touches their orphaned
  submissions is `discard_orphaned_submissions` (DR-FR-001),
  which is data loss.

## What Changes

Four coordinated fixes (issue #849 fix shape):

1. **Derived per-run timeout** — a deterministic formula in
   the tool layer: base window plus terms for prompt bytes and
   change-profile tier, a contention multiplier when
   `max_parallel_runs > 1`, clamped to a configurable ceiling
   that MUST NOT exceed the existing 1_800_000 ms schema bound.
2. **Matrix limit wired into execution** — when
   `per_run_timeout_ms`/`timeout` is omitted,
   `dispatch_review_runs` and `redispatch_failed_runs` default
   to the matrix `limits.per_run_timeout_seconds` (and any
   per-tier overrides) instead of the agent-executor 600_000
   default. Explicit arguments still win.
3. **Timeout provenance in run files** — the effective timeout
   and its derivation inputs are recorded per run, so
   postmortems do not have to infer contention from
   timestamps.
4. **Recoverable parent-window cancellation** — the
   dispatch/redispatch overall window is recorded in
   machine-readable operation records, and DR-FR-002
   (`redispatch_failed_runs`) is extended so cancelled runs can
   be re-run: they are infra failures in recovery terms, not
   judgment calls to discard.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `review-dispatch`: per-run timeout resolution becomes
  work-derived with the matrix limit as its wired-in base;
  run records gain timeout provenance; dispatch operations
  record their overall window.
- `dispatch-recovery`: partial re-dispatch (DR-FR-002) re-runs
  cancelled runs (not only failed runs) and restores stranded
  superseded archives left by killed recovery invocations.
- `review-matrix`: the limits surface gains optional per-run
  timeout derivation fields (ceiling, per-tier base
  overrides) in the plugin `LimitsSchema` and the canonical
  JSON Schema registry (RD-FR-009/RD-FR-010); the canonical
  `.uf/review-matrix.yaml` itself is NOT modified.

### Removed Capabilities

(none)

## Impact

- `.opencode/plugins/review-dispatch/index.ts` — timeout
  resolution in `dispatch_review_runs` and
  `redispatch_failed_runs`; run-file persistence gains the
  timeout provenance record; session-level operation window
  records; recovery target predicate extended to `cancelled`;
  stranded-archive restoration.
- New `.opencode/lib/` module for the pure timeout-derivation
  function (single source of truth shared by both tools).
- `.opencode/lib/agent-executor.ts` — execution semantics and
  the `TimeoutSchema` 1_800_000 ms bound are preserved
  unchanged; the flat 600_000 default stops being the
  effective default for the two dispatch tools.
- Review matrix limits surface — the plugin `LimitsSchema`
  and the canonical JSON Schema registry
  (`schemas/review-matrix/v3.schema.json`) gain additive
  optional fields only (derivation ceiling, per-tier timeout
  overrides) with code defaults when absent. The canonical
  `.uf/review-matrix.yaml` and its scaffold mirror are NOT
  modified (no new keys, no value changes); setting values
  there would be a review-limit change requiring documented
  maintainer authorization. No existing limit value changes.
- Scaffold mirrors — every modified canonical asset is
  synced byte-identical to its embedded copy: `index.ts`,
  the five command files, and the new
  `.opencode/lib/run-timeout.ts` under
  `internal/scaffold/assets/opencode/` (the lib module is
  registered as a scaffold asset — embedded copy,
  asset-surface enumeration, drift-table entry — because
  the mirrored plugin imports it), plus the three
  review-matrix schema copies: the root registry
  `schemas/review-matrix/`, the deployed
  `.uf/schemas/review-matrix/`, and the embedded
  `internal/scaffold/assets/uf/schemas/review-matrix/`.
- `.opencode/test/` — unit tests for the derivation formula,
  precedence, clamping, provenance records, window records,
  and the recovery extension.
- Command prose (`uf.review-council.md`, `uf.review-pr.md`,
  `uf.triage-issue.md`, `uf.address-feedback.md`,
  `uf.unleash.md`) — documentation-only alignment: the
  `per_run_timeout_ms` guidance notes the derived default.
- Content coverage: blog — assessed, no (internal
  reliability fix; the incident carries a possible postmortem
  angle for future coverage); tutorial — no (no new operator
  workflow).

Gatekeeping note: no review-limit value is modified by this
change. The configured `per_run_timeout_seconds: 1200` is
preserved verbatim and becomes the derivation base (raising
the effective omitted-argument floor from 600 s to the
configured value); the derivation ceiling is bounded by the
existing `TimeoutSchema`/`validateTimeout` 1_800_000 ms bound.
This change strengthens enforcement of the configured limit;
it does not weaken, bypass, or disable any gate.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0,
amended 2026-10-14; six active principles).

### I. Autonomous Collaboration

**Assessment**: PASS

Timeout derivation is deterministic tool-layer logic — heroes
collaborate through the same artifacts as before. The timeout
provenance record and the operation window records are
self-describing, machine-readable additions to the existing
run-file and session-directory artifacts. Recovery remains
artifact-driven (run files plus session directory), never
runtime coupling between the recovery operator and the
original dispatch session.

### II. Composability First

**Assessment**: PASS

The derivation is a pure function in a shared `.opencode/lib/`
module, usable standalone and testable without the plugin.
`dispatch_review_runs`, `redispatch_failed_runs`,
`dispatch_status`, and `discard_orphaned_submissions` each
remain independently usable. No new mandatory dependencies are
introduced; the matrix additions are optional fields with
defaults.

### III. Observable Quality

**Assessment**: PASS

Every run record gains the effective timeout and its
derivation inputs (source, base, prompt bytes, profile
signals, contention multiplier, ceiling, clamp outcome), and
every dispatch/redispatch operation records its overall window
(start, end, terminal state) in machine-parseable JSON with an
interrupted-operation signal (start without end). Postmortems
stop inferring contention from timestamps.

### IV. Testability

**Assessment**: PASS

The derivation function is pure (no I/O, no clock, no
network) and unit-testable in isolation across formula,
precedence, and clamping edge cases. Window records and the
recovery extension are testable through the established
injectable filesystem patterns in `.opencode/test/`. No
external services are required to verify any requirement.

### V. Security by Default

**Assessment**: PASS

No secrets, authentication, or injection surface is touched.
The optional matrix fields carry safe defaults (schema-bound
ceiling, no per-tier overrides) when absent, and D4 tightens
the `per_run_timeout_ms` input to the shared `TimeoutSchema`
semantics (positive int <= 1_800_000), closing an
unbounded-input gap rather than widening one.

### VI. Deterministic Execution

**Assessment**: PASS

The change replaces prose-mediated timeout selection — an
orchestrating LLM copying the matrix limit into an argument —
with a deterministic pure tool-layer function: identical
inputs produce identical timeouts, every effective value
carries machine-readable provenance, and no LLM judgment
participates in timeout computation (cf.
unleash-deterministic-tools D11).
