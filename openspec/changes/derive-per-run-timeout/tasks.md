<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task (a) touches different files from
  other [P] tasks in the same group, (b) has no dependency
  on prior tasks in the group, and (c) can safely execute
  without ordering constraints. Do NOT add [P] when tasks
  modify the same file. Tasks without [P] run sequentially
  first, then [P] tasks run in parallel.
-->

## 1. Shared timeout-derivation module

- [x] 1.1 Create `.opencode/lib/run-timeout.ts` exporting the
  pure `derivePerRunTimeoutMs(signals)` function per design
  D1: named constants (`PROMPT_FREE_BYTES = 65_536`,
  `MS_PER_KIB_ABOVE_FREE = 1_500`, tier terms
  lightweight 0 / standard 120_000 / heavy 300_000 / 0 for
  tier-less direct-model entries, contention factor 0.15
  capped at multiplier 1.5), the
  `TimeoutProvenanceRecord` type per D5, floor-at-base and
  ceiling clamping (`min(configuredCeilingMs, 1_800_000)`
  raised to the base window when lower — floor precedence),
  tier-source precedence (the plan entry's resolved tier is
  the sole tier input; session change-profile tier is
  provenance only), and an explicit-source passthrough. No
  I/O, no clock.
- [x] 1.2 Add `.opencode/test/run-timeout.test.ts` unit
  tests: formula arithmetic, monotonicity in prompt bytes and
  tier, contention multiplier applied only above
  `max_parallel_runs` of 1 and capped at 1.5, floor never
  below base, ceiling clamp including the 1_800_000 bound, a
  configured ceiling below the base window resolving to the
  base (floor precedence), tier-less entries deriving a zero
  profile term, determinism (identical inputs, identical
  output), and explicit-source passthrough (RD-FR-028
  scenarios).

## 2. Review matrix schema additions

- [x] 2.1 In `.opencode/plugins/review-dispatch/index.ts`,
  extend `LimitsSchema` with optional
  `per_run_timeout_ceiling_seconds` and
  `per_run_timeout_tiers` (`lightweight`/`standard`/`heavy`,
  each `z.number().int().min(30).max(1800).optional()`) per
  design D6; extend the `Limits` type and `limitsFor` merge
  with a 1800 s ceiling default when absent. Do NOT modify
  the canonical `.uf/review-matrix.yaml` or its scaffold
  mirror — no limit value changes (gatekeeping).
- [x] 2.2 Add unit tests for the matrix resolution: optional
  fields parse, absent fields keep the existing
  matrix-defaults fallback (600 s base, 1800 s ceiling),
  out-of-range values are rejected, a ceiling below the base
  resolves to the base (floor precedence), and per-tier
  overrides resolve alongside the scalar limit (RD-FR-029
  scenarios).
- [x] 2.3 [P] Sync all three review-matrix schema copies
  (RD-FR-010): extend `$defs/limits` with the same optional
  fields and 30-1800 bounds in the root registry
  `schemas/review-matrix/v3.schema.json`, the deployed
  `.uf/schemas/review-matrix/v3.schema.json`, and the
  embedded scaffold asset
  `internal/scaffold/assets/uf/schemas/review-matrix/v3.schema.json`
  (the embedded/deployed pair is drift-test-enforced); extend
  boundary samples (valid ceiling/per-tier overrides;
  `invalid-limits.json` out-of-range cases) and add the
  README version-history row in both maintained copies —
  the root registry `schemas/review-matrix/` and the
  deployed `.uf/schemas/review-matrix/` (a byte-identical
  mirror including its README and samples).

## 3. Run-record timeout provenance

- [x] 3.1 In `.opencode/plugins/review-dispatch/index.ts`,
  add the optional run-file-only `timeout` field to
  `PersistedRunData` (D5 shape: `effective_ms`, `source`,
  `base_ms`, `prompt_bytes`, `prompt_term_ms`,
  `profile_term_ms`, `resolved_tier`, `session_profile_tier`,
  `contention_multiplier`,
  `max_parallel_runs`, `ceiling_ms`, `clamped`) and thread an
  effective-timeout + provenance input through
  `ExecuteDispatchRunOptions` into the persisted record. The
  strict `DispatchRunSchema` consolidate mapping MUST omit
  the field; older run files without it MUST remain valid.
- [x] 3.2 Surface each run's `effective_ms` in
  `dispatch_status` output when the provenance record is
  present (RD-FR-030 SHOULD).
- [x] 3.3 Add unit tests: derived run records its inputs,
  explicit run records its value, run files predating the
  field parse and consolidate unchanged, and
  `dispatch_status` surfaces the effective timeout.

## 4. dispatch_review_runs derivation wiring

- [x] 4.1 Align the `per_run_timeout_ms` input to
  `TimeoutSchema` semantics (positive integer ≤ 1_800_000)
  and update its description text (design D4 — a validation
  tightening, not a gate change).
- [x] 4.2 In `dispatchReviewRuns`, derive the per-run timeout
  per plan entry after prompts are built — base from the
  matrix limit or per-tier override (RD-FR-029), prompt term
  from the persisted prompt file's byte size, profile term
  from the entry's resolved tier (0 for tier-less entries),
  contention multiplier from
  `max_parallel_runs` — and pass the derived value plus its
  provenance as the explicit per-run timeout on the internal
  `dispatchAgentRun` calls (design D2). An explicit
  `per_run_timeout_ms` argument MUST win for every entry.
  Persist the operation's timeout resolution in run records
  via task 3.1 plumbing.
- [x] 4.3 Add integration tests: omitted argument derives
  from the matrix base (1200 s configured, never the 600_000
  flat default), per-entry tiers derive different bases,
  explicit argument overrides derivation, contention applies
  above `max_parallel_runs` of 1, large derivations clamp at
  the ceiling, and an explicit `per_run_timeout_ms` above
  1_800_000 is rejected (RD-FR-028/029 scenarios; design D4
  input tightening).

## 5. redispatch_failed_runs derivation wiring

- [x] 5.1 In `redispatch_failed_runs`, replace the
  `input.timeout ?? DEFAULT_TIMEOUT_MILLISECONDS` resolution
  with the shared derivation per re-run — persisted prompt
  byte length, plan-entry tier, session change profile, NO
  contention multiplier (sequential execution) — with
  explicit `timeout` still winning, and provenance persisted
  through the task 3.1 plumbing. Update the tool description:
  omission derives from the matrix limit and the work, no
  longer "the dispatch default (600_000 ms) applies".
- [x] 5.2 Add unit tests: omitted timeout derives at or above
  the matrix base, explicit timeout wins, no contention
  multiplier on re-runs, and the description no longer
  promises the 600_000 default (RD-FR-029 redispatch
  scenario).

## 6. Dispatch operation window records

- [x] 6.1 Implement `operation-<uuid>.json` records per
  design D7 for both `dispatch_review_runs` and
  `redispatch_failed_runs`: write `{kind, operation_id,
  started_at}` at invocation start via write-temp-then-rename;
  complete with `completed_at`, terminal state, and run
  counts (completed/failed/skipped; redispatched/refused plus
  restored count) when the invocation settles. The
  `run-*.json` discovery glob MUST be unaffected.
- [x] 6.2 Extend `dispatch_status` to read all
  `operation-*.json` records, report each operation's window,
  and flag records with `started_at` but no `completed_at` as
  interrupted operations (RD-FR-031). Update the
  `dispatch_status` tool description to document the new
  output surfaces: operation windows, interrupted-operation
  reporting, and per-run effective timeouts (DE-007
  registration-surface parity).
- [x] 6.3 Add unit tests: completed dispatch and redispatch
  invocations record their windows with run counts, a
  start-without-end record is reported as interrupted by
  `dispatch_status`, and older sessions without operation
  records produce no error.
- [x] 6.4 DE-007 seam verification naming the three layers:
  registration surface (the `per_run_timeout_ms` input
  schema aligns with the executor `TimeoutSchema`
  1_800_000 bound, and the `dispatch_status` and
  `redispatch_failed_runs` tool descriptions document the
  new surfaces); documented output shape (assertions on
  the run-record timeout-provenance fields and the
  `dispatch_status` operation-window, interrupted-
  operation, and per-run effective-timeout output);
  write-then-read round-trips (run files carrying timeout
  provenance readable through consolidation; operation
  records written by dispatch and redispatch readable
  through `dispatch_status`).

## 7. DR-FR-002 recovery extension

- [x] 7.1 Widen the redispatch target predicate from
  `run.status === "failed"` to failed OR cancelled for both
  the omitted-agents default and the named-filter path
  (design D8); update the refusal reason and tool description
  to "only failed and cancelled runs are redispatch targets".
  Cancelled re-runs reuse the persisted prompt and original
  plan entry exactly like failed re-runs.
- [x] 7.2 Implement stranded-archive restoration in
  `redispatch_failed_runs`: before target resolution, restore
  each `superseded/run-<agent>-<run_id>.json` whose agent has
  no active `run-<agent>.json` to the active path (most
  recent by mtime when several exist); count and report
  restorations; never touch archives whose plan entry has an
  active run file.
- [x] 7.3 Add unit tests: a cancelled run (parent-window
  death, with harvested findings) is re-run and its
  replacement supersedes the prior record while the prior
  stays archived; a named successful run is still refused per
  run; a stranded archive is restored before target
  resolution and the session becomes consolidatable; multiple
  archives restore the most recent; a re-run cancelled again
  is handled by RD-FR-025 exclusion (DR-FR-002 scenarios).

## 8. Documentation alignment

- [x] 8.1 [P] Update the `per_run_timeout_ms` guidance in
  `.opencode/commands/uf.review-council.md`,
  `uf.review-pr.md`, `uf.triage-issue.md`,
  `uf.address-feedback.md`, and `uf.unleash.md` (the same
  guidance in its plan-limits passages): omission now derives
  from the matrix limit and the dispatched work; explicit
  values still win. Documentation-only — no behavior change.
- [x] 8.2 Add the `CHANGELOG.md` entry for the derived
  per-run timeout, matrix wiring, timeout provenance,
  operation windows, and the cancelled-run recovery path.
- [x] 8.3 File the documentation gates if the behavior
  change is classified user-facing at implementation time:
  the in-repo AGENTS.md documentation issue AND, per the org
  constitution v1.4.0 Cross-Repo Documentation rule, the
  unbound-force/website repo issue; otherwise record the
  internal-tooling exemption rationale in the CHANGELOG.md
  entry from task 8.2. The classification MUST weigh the
  user-facing surfaces this change touches — the tightened
  `per_run_timeout_ms` input contract, the new
  `dispatch_status` and run-record output fields, the
  RD-FR-009 review-matrix config fields
  (`per_run_timeout_ceiling_seconds`,
  `per_run_timeout_tiers`), and the command-prose
  guidance — so an exemption rationale addresses them. Not `[P]`: the exemption branch writes the
  CHANGELOG.md entry task 8.2 creates.

## 9. Verification

- [x] 9.1 Sync the scaffold mirror surface: byte-identical
  embedded copies for the modified `index.ts` and the five
  command files under `internal/scaffold/assets/opencode/`;
  register `.opencode/lib/run-timeout.ts` on the scaffold
  asset surface (embedded copy, "Shared lib modules"
  enumeration entry, `task42CanonicalAssets` drift-table
  entry); confirm the three schema copies from task 2.3 are
  byte-identical. Scaffold assets traced to this change ship
  with the feature PR per the AGENTS.md commit-scope rule.
- [x] 9.2 Run `make check` (lint, Go tests, build,
  coverage-gate, plugin-test) and confirm the `.opencode/`
  plugin suite stays at or above the governance-controlled 94
  percent statements coverage floor — CI parity with
  `ci_local.yml` per AGENTS.md.
- [x] 9.3 Verify constitution alignment: the derivation is a
  pure standalone function (II, IV), provenance and window
  records are machine-parseable artifacts with no runtime
  coupling (I, III), input validation is tightened not
  weakened (V), timeout selection is deterministic with no
  LLM judgment (VI), and every new behavior is testable in
  isolation without external services (IV). Record the
  verification outcome in the CHANGELOG.md entry from task
  8.2.
- [x] 9.4 Verify gatekeeping: `git diff` shows the canonical
  `.uf/review-matrix.yaml` and its scaffold mirror are
  value-identical to the base branch, no coverage/CRAP/severity
  gate files are modified, and the `TimeoutSchema`
  1_800_000 ms bound is unchanged. Stop and report per the
  gatekeeping rule if any check fails.
