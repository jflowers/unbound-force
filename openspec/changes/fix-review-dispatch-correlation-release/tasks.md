<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the same group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.

  Coverage strategy (Constitution IV): every new code path
  in this change — per-invocation correlation minting, map
  re-pointing, session-less invocation handling, and the
  observable correlation_id output — gets at least one
  positive and one negative test under .opencode/test/
  (vitest 5, temp-dir isolation, existing test exports
  including _getSessionCorrelationMap). The suite runs with
  coverage via `make plugin-test`; `make check` enforces
  the repo gates. No test may depend on network or live
  LLM providers.
-->

## 1. Pre-Implementation Verification (read-only)

- [x] 1.1 Verify in `.opencode/plugins/review-dispatch/index.ts`
      that `dispatchReviewRuns` return paths after input
      validation (all-skip, prompt-building failure, budget
      exhaustion, success) are the complete set needing the
      `correlation_id` output field, and that no consumer of
      `sessionCorrelationMap` besides those listed in design.md
      Context exists (grep `sessionCorrelationMap`).
- [x] 1.2 Confirm the five consumer commands
      (`uf.triage-issue`, `uf.review-council`, `uf.review-pr`,
      `uf.address-feedback`, `uf.unleash`) each retrieve or
      consolidate immediately after their `dispatch_review_runs`
      call (correct latest-wins sequencing) and require no
      command-file changes for RD-CR-001..003.

## 2. Correlation Lifecycle (RD-CR-001..003, design D1/D3/D5)

All tasks in this group modify
`.opencode/plugins/review-dispatch/index.ts` — sequential.

- [x] 2.1 In `dispatchReviewRuns`: mint a fresh correlation ID
      immediately after input validation succeeds (before
      sibling evidence acquisition) and re-point
      `sessionCorrelationMap` to it, so the invocation's prompts,
      internal `dispatchAgentRun` calls, session metadata, and
      findings collection all resolve to the new session (D1).
      Rewrite the `sessionCorrelationMap` doc comment to
      latest-dispatch semantics (D5).
- [x] 2.2 Add `correlation_id` to `DispatchReviewRunsOutputSchema`
      and include it on every result returned after input
      validation — success, all-skip, prompt-building failure,
      and budget-exhausted paths — plus the tool's `output`
      summary string (D3). Leave the pre-parse validation-failure
      return unchanged (no correlation exists yet).
- [x] 2.3 Verify no dispatch-side behavior changed for direct
      `dispatch_agent_run` calls: mint when the map has no entry,
      reuse otherwise, joining the latest aggregate session after
      one (D2). No code change expected; record the confirmation.

## 3. Scaffold Twin Sync

- [x] 3.1 Sync `internal/scaffold/assets/opencode/plugins/
      review-dispatch/index.ts` byte-identical with the canonical
      plugin file per the scaffold-parity obligation, and run the
      embedded-asset drift-detection tests.

## 4. Tests

Different files — parallel-eligible. Each task covers the
RD-CR-001..003 scenarios from the specs delta, including the issue
#794 reproduction (two aggregate dispatches from one parent
session).

- [x] 4.1 [P] Rewrite/extend `dispatch-review-runs.test.ts`:
      replace the "correlation is shared" FR-007 assertion with
      the new lifecycle — two invocations from one parent session
      mint distinct correlations with distinct session dirs and
      the first session's run files and metadata survive the
      second invocation; an all-skip or prompt-failure invocation
      re-points the map so retrieval fails closed as not_found;
      the output reports the invocation's correlation_id; prompts
      land under the session's `prompts/` dir.
- [x] 4.2 [P] Extend `consolidate-dispatch.test.ts` and
      `dispatch-status.test.ts`: after two aggregate dispatches,
      no-provenance retrieval and status resolve the latest
      session; explicit `correlation_id` retrieves the earlier
      session's payload.
- [x] 4.3 [P] Extend `dispatch-agent-run.test.ts` regression:
      direct multi-call fan-out still shares one session (mint on
      first call, reuse after), and a direct call following an
      aggregate dispatch joins the latest aggregate session.

## 5. Verification and Documentation

- [x] 5.1 Run `make plugin-test` — all plugin tests pass with
      coverage (94 percent statements floor for the `.opencode/`
      suite).
- [x] 5.2 Run `make check` — full CI parity (lint, test, build,
      coverage gate, plugin tests).
- [x] 5.3 Verify constitution alignment: observable correlation
      provenance (III), standalone tool usability via explicit
      correlation_id (II), no new dependencies and permission
      patterns preserved (V), lifecycle as tested tool logic
      (VI), coverage strategy executed (IV), sessions as
      self-describing artifacts (I).
- [x] 5.4 Add the change entry to `CHANGELOG.md` (user-facing
      dispatch behavior change).
- [x] 5.5 File the in-repo documentation issue for the
      user-facing dispatch-session lifecycle change (label
      docs) per the documentation gate.
<!-- scaffolded by uf vdev -->
