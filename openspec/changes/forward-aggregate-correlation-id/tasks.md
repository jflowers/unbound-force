<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency on
  prior tasks in the group, (c) can safely execute without
  ordering constraints.
  Do NOT add [P] when tasks modify the same file — parallel
  workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Plugin description guidance and mirror (RD-CF-002)

- [x] 1.1 Add one forwarding-guidance sentence to the
      `dispatch_review_runs` tool description in
      `.opencode/plugins/review-dispatch/index.ts`: direct the
      caller to pass the reported `correlation_id` to
      `consolidate_dispatch`. No schema, precedence, or result
      changes (design D4).
- [x] 1.2 Copy the edited plugin source over the scaffold
      mirror at
      `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
      so the two remain byte-identical.
- [x] 1.3 Run the Go drift tests (`go test -race -count=1
      ./internal/scaffold/...`) and confirm mirror identity
      holds.

## 2. Command prose forwarding (RD-CF-001)

- [x] 2.1 Edit `.opencode/commands/uf.review-pr.md` (primary
      pattern-setter, issue #872's failing caller): Section 4c
      gains capture prose for the correlation ID reported in
      the one-line summary (design D2); Section 5a retrieval,
      Section 5b finalization, and every retry instruction pass
      `correlation_id`; the retrieval failure-mode prose is
      reclassified per design D5 (a `not_found` with the
      forwarded ID for a dispatch that executed runs is
      permanent; all-skip stays a valid outcome). Sync the
      scaffold mirror
      `internal/scaffold/assets/opencode/commands/uf.review-pr.md`.
- [x] 2.2 [P] Apply the same forwarding prose pattern to
      `.opencode/commands/uf.review-council.md` (dispatch
      step, Section 4 retrieval, finalization section, retry
      prose) and sync its scaffold mirror.
- [x] 2.3 [P] Apply the same forwarding prose pattern to
      `.opencode/commands/uf.triage-issue.md` (Section 2.2
      dispatch, Section 2.3 retrieval, finalization section,
      retry prose) and sync its scaffold mirror.
- [x] 2.4 [P] Apply the same forwarding prose pattern to
      `.opencode/commands/uf.address-feedback.md` (Section
      2.3.4 per-item dispatch, Section 2.3.7 retrieval,
      finalization section, retry prose — the captured ID is
      per feedback item's dispatch) and sync its scaffold
      mirror.
- [x] 2.5 [P] Apply the same forwarding prose pattern to
      `.opencode/commands/uf.unleash.md` at both dispatch
      sites (Step 4 spec review and Step 6 code review),
      threading each dispatch's ID to its consolidation calls,
      and sync its scaffold mirror.

## 3. Plugin test suite locks (RD-CF-001, RD-CF-003)

- [x] 3.1 Add a cross-session aggregate consolidation suite to
      `.opencode/test/dispatch-review-runs.test.ts`: dispatch
      via `dispatch_review_runs` under a fixture session S1,
      then (a) consolidate with `{ correlation_id }` from a
      different `ToolContext.sessionID` and assert run and
      finding retrieval with the ID echoed; (b) consolidate
      without the ID from the different session and assert
      `not_found`; (c) consolidate without the ID from S1 and
      assert the map fallback still succeeds; (d) consolidate
      with a well-formed unknown ID and assert `not_found`
      (design D7).
- [ ] 3.2 [P] Add a registration-surface lock in
      `.opencode/test/registration-surface.test.ts`: the
      `consolidate_dispatch` tool declares `correlation_id`
      as an optional argument in its model-facing args.
- [x] 3.3 Refresh the edited commands' line-number site labels
      and the consolidate-site census comments in
      `.opencode/test/golden-output-shape.test.ts` so the
      documented call sites match the post-edit files.

## 4. Go contract locks and verification

- [ ] 4.1 Add presence-only phrase assertions to
      `internal/scaffold/command_contract_test.go` locking the
      forwarding instruction in each of the five commands;
      preserve all existing asserted phrases, updating one only
      where the prose edit necessarily touches it (contract
      refresh, never gate weakening).
- [ ] 4.2 Run `go test -race -count=1 ./internal/scaffold/...`
      and confirm drift and contract tests pass with the new
      assertions.

## 5. Full validation, docs gate, and constitution check

- [ ] 5.1 Run `make plugin-test` and confirm the TypeScript
      suite passes including the 94 percent statements coverage
      floor.
- [ ] 5.2 Run `make check` (CI parity: lint, test, build,
      coverage gate, plugin tests) and confirm every gate
      passes without modification.
- [ ] 5.3 Documentation gate: assess impact — command prose
      and its scaffold mirrors are the user-facing surface and
      are updated in place; determine whether a documentation
      issue is required or the internal-tooling exemption
      applies, and record the decision in the PR description.
- [ ] 5.4 Constitution alignment verification: confirm each
      proposal assessment holds in the implementation —
      artifact-threaded IDs over runtime coupling (I), map
      fallback and standalone tool use preserved (II),
      machine-parseable `not_found` envelopes with echoed
      correlation IDs (III), isolated fixture-context tests
      with no external services (IV).
