<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.

  Coverage strategy (Constitution IV): every new code
  path in this change — the success-scoping filter, the
  post-submission reclassification predicate, exclusion
  warnings, correlation-id resolution, prompt
  persistence, metadata refresh, discard, and
  re-dispatch — gets at least one positive and one
  negative test under .opencode/test/ (vitest 5,
  temp-dir isolation, existing test exports). The suite
  runs with coverage via `make plugin-test`; `make
  check` enforces the repo gates. No test may depend on
  network or live LLM providers.
-->

## 1. Pre-Implementation Verification (read-only)

- [x] 1.1 Verify in `.opencode/plugins/review-dispatch/index.ts`
      (`validateRunState`, ~line 2056) whether a success run may
      carry a non-null `error`; record the finding and pick the
      D2 error-emission path (null-error fallback is default).
- [x] 1.2 Verify whether `dispatch_status` (~line 4207) already
      reports per-run `usage`; if yes, task 4.2 becomes a no-op
      recorded as such.

## 2. Success-Scoped Consolidation (RD-FR-025, design D1)

All tasks in this group modify
`.opencode/plugins/review-dispatch/index.ts` — sequential.

- [x] 2.1 In `consolidate_dispatch` (~3183-3345): derive
      `collectedProposals`, `deduplicateFindings` input, and
      `dispatchRuns[].findings` from `status === "success"` runs
      only; non-success payload runs emit empty findings arrays.
- [x] 2.2 Add a machine-readable `warnings` array to the
      consolidate result: one `orphaned_submissions_excluded`
      entry per excluded run with agent, run_id, and discarded
      finding/proposal counts. Zero-success keeps the RD-FR-007
      fail-closed path; finalizer code untouched.

## 3. Post-Submission Completion Status (RD-FR-026, design D2)

Same file as group 2 — sequential.

- [x] 3.1 In `dispatchAgentRun` (~2871-2917): reclassify to
      success when status is `failed` AND `error.code ===
      "child_message_error"` AND harvested findings/proposals
      exist AND `result.text` is non-empty. Timeout, cancelled,
      pre-submission, and model-mismatch runs stay `failed`.
- [x] 3.2 Add optional audit field to `PersistedRunData`
      (e.g. `post_submission_abort`) recording the abort
      circumstances in the run file; emit the finalization-payload
      run per the 1.1 verdict (default: `error: null`).

## 4. Cross-Session Resolution and Observability (RD-FR-027, D3/D6)

- [x] 4.1 Add optional `correlation_id` parameter to
      `consolidate_dispatch` and `dispatch_status`, falling back
      to `sessionCorrelationMap` when omitted.
- [x] 4.2 Include per-run input/output token `usage` in
      `dispatch_status` output (no-op if 1.2 confirms present).

## 5. Recovery Groundwork (D4/D5)

Same file — sequential.

- [x] 5.1 Persist the run prompt in the run record at dispatch
      time, and persist `session-metadata.json` whenever
      `session_metadata` is supplied (not only on first call).
- [x] 5.2 Extract the shared dispatch core (model resolution,
      child execution, harvest, run-file persistence) into an
      internal `executeDispatchRun()` used by `dispatch_agent_run`
      and the group-6 tools.

## 6. Recovery Tools (DR-FR-001..003, design D4)

Same file — sequential after group 5.

- [x] 6.1 Add `discard_orphaned_submissions(correlation_id,
      agents?)`: rewrite non-success run files with emptied
      findings/proposals plus a `discarded_submissions` audit
      block; refuse successful runs; return a machine-readable
      summary.
- [x] 6.2 Add `redispatch_failed_runs(correlation_id, agents?,
      timeout?)`: re-run failed reviewers via `executeDispatchRun`
      with the original prompt and plan entry; move prior run
      files to a `superseded/` subdir (outside the `run-*.json`
      glob) before writing the replacement.

## 7. Tests

Different files — parallel-eligible. Each task covers the
scenarios from the specs delta, including the issue #751
reproduction (failed run with accepted submissions).

- [x] 7.1 [P] Extend `consolidate-dispatch.test.ts`: exclusion of
      failed-run findings/proposals, warning contents, zero-success
      fail-closed, all-success no-warning, payload passes finalizer
      validation.
- [x] 7.2 [P] Extend `dispatch-agent-run.test.ts`: reclassification
      predicate (all four criteria, each negated), audit field,
      prompt persistence, metadata refresh on subsequent calls.
- [x] 7.3 [P] Extend `dispatch-status.test.ts`: explicit
      correlation_id resolution and usage reporting.
- [x] 7.4 [P] New `dispatch-recovery.test.ts`: discard (success-run
      refusal, audit block, post-discard consolidation clean),
      redispatch (replacement not duplication, superseded/ archive,
      failed-again RD-FR-025 exclusion, fail-closed zero-success).
- [x] 7.5 [P] Extend `finalize-error-boundaries.test.ts`:
      regression that finalizer validation itself is unchanged.

## 8. Verification and Documentation

- [x] 8.1 Run `make plugin-test` — all plugin tests pass with
      coverage.
- [x] 8.2 Run `make check` — full CI parity (lint, test, build,
      coverage gate, plugin tests).
- [x] 8.3 Verify constitution alignment: machine-readable
      warnings/audit records (III), standalone tool usability via
      correlation_id (II), no new dependencies and permission
      patterns preserved (V), recovery as tested tools not prose
      (VI), coverage strategy executed (IV).
- [x] 8.4 Add the change entry to `CHANGELOG.md` (user-facing
      workflow recovery behavior).
- [x] 8.5 File the in-repo documentation issue for the
      user-facing recovery tooling
      (unbound-force/unbound-force#766, label docs).
- [x] 8.6 File the unbound-force/website documentation issue
      (unbound-force/website#313).
- [x] 8.7 File the recovery-workflow tutorial issue
      (unbound-force/unbound-force#767, label tutorial).
<!-- scaffolded by uf vdev -->
