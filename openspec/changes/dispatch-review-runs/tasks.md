<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file --
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Tool Implementation

- [x] 1.1 Define `DispatchReviewRunsInputSchema` with
  Zod validation in `review-dispatch/index.ts`: mode,
  command, diff_path, changed_files, input_context,
  plan_entries (array), max_parallel_runs, budget_usd
  (optional), per_run_timeout_ms (optional),
  session_metadata, plus optional pre_flight_results,
  existing_reviews, walkthrough, review_context.
  Files: `.opencode/plugins/review-dispatch/index.ts`

- [x] 1.2 Implement `dispatchReviewRuns()` function:
  (a) call `acquireSiblingEvidence` internally, handle
  failure gracefully with empty-evidence fallback;
  (b) call `buildReviewPrompts` with acquired evidence
  and all context inputs; (c) dispatch each plan entry
  via `dispatchAgentRun` in parallel batches respecting
  `max_parallel_runs`; (d) pass `session_metadata` on
  first `dispatchAgentRun` call only; (e) check
  cumulative cost against `budget_usd` between batches;
  (f) record `budget_skipped` or `limit_skipped` for
  remaining runs when limits hit; (g) isolate errors
  (one failed run does not cancel others); (h) return
  compact summary `{ status, runs_completed,
  runs_failed, runs_skipped, findings, proposals }`.
  Files: `.opencode/plugins/review-dispatch/index.ts`

- [x] 1.3 Implement `createDispatchReviewRunsTool()`
  factory function wrapping `dispatchReviewRuns()` with
  tool description and args. Wire into
  `ReviewDispatchPlugin.server()` registration (tool
  count 10 -> 11).
  Files: `.opencode/plugins/review-dispatch/index.ts`

## 2. Command File Updates

- [x] 2.1 [P] Update `uf.review-council.md`: replace
  Steps 4c-5 multi-step sequence with single
  `dispatch_review_runs` call. Remove `dispatch_status`
  call before `consolidate_dispatch`.
  Files: `.opencode/commands/uf.review-council.md`

- [x] 2.2 [P] Update `uf.review-pr.md`: same changes
  as 2.1.
  Files: `.opencode/commands/uf.review-pr.md`

- [x] 2.3 [P] Update `uf.triage-issue.md`: same changes
  as 2.1.
  Files: `.opencode/commands/uf.triage-issue.md`

- [x] 2.4 [P] Update `uf.address-feedback.md`: same
  changes as 2.1.
  Files: `.opencode/commands/uf.address-feedback.md`

## 3. Dual-Copy Sync

- [x] 3.1 Sync plugin to canonical:
  `cp .opencode/plugins/review-dispatch/index.ts
  internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`.
  Verify byte-identical via the existing drift detection
  tests in `internal/scaffold/scaffold_test.go`.
  Files: `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`

- [x] 3.2 [P] Sync command files to canonical:
  `cp .opencode/commands/uf.review-council.md
  internal/scaffold/assets/opencode/commands/uf.review-council.md`
  (repeat for all 4 commands). Verify byte-identical.
  Files: `internal/scaffold/assets/opencode/commands/*.md`

## 4. Tests

- [x] 4.1 [P] Create `dispatch-review-runs.test.ts`
  with test cases:
  - Dispatches all included plan entries and returns
    compact summary
  - Respects max_parallel_runs batch size
  - Isolates failures (one failed run doesn't cancel
    others)
  - Skips remaining runs when budget exceeded
  - Passes session_metadata only on first internal call
  - Handles evidence acquisition failure gracefully
  - Returns error for invalid inputs (empty plan_entries,
    missing diff_path)
  Files: `.opencode/test/dispatch-review-runs.test.ts`

- [x] 4.2 [P] Update `scratch-smoke.test.ts` expected
  tool count from 10 to 11, add
  `dispatch_review_runs` to tool name list.
  Files: `.opencode/test/scratch-smoke.test.ts`

- [x] 4.3 [P] Update `plugin-integration.test.ts`
  expected tool count from 10 to 11, add
  `dispatch_review_runs` to tool name list.
  Files: `.opencode/test/plugin-integration.test.ts`

## 5. Verification

- [x] 5.1 Run `make plugin-test` — all tests pass,
  branch coverage >= 85%.

- [x] 5.2 Run `make check` — full CI parity (Go lint,
  vet, test, build, coverage-gate, plugin tests).

- [x] 5.3 Verify constitution alignment covers all five
  principles: composes existing standalone functions
  (Principle I/II), returns structured machine-parseable
  output (Principle III), is testable with injectable
  dependencies (Principle IV), introduces no new input
  surfaces or dependencies (Principle V).

<!-- spec-review: passed -->
