<!--
  [P] marks tasks eligible for parallel execution.
-->

## 1. Tool Implementation

- [ ] 1.1 Define `FetchPrReviewContextInputSchema` with
  Zod validation: `pr_number` (positive integer).
  Files: `.opencode/plugins/review-dispatch/index.ts`

- [ ] 1.2 Implement `fetchPrReviewContext()` function:
  validate `gh` CLI + auth via BunShell; fetch PR metadata
  (`gh pr view --json`); fetch CI checks (`gh pr checks
  --json`); fetch diff (`gh pr diff`), save to temp file;
  fetch existing reviews and inline comments; pre-compute
  `input_context`, `changed_files`, `exceeds_threshold`,
  `ci_pending`; return structured output.
  Files: `.opencode/plugins/review-dispatch/index.ts`

- [ ] 1.3 Implement `createFetchPrReviewContextTool()`
  factory function. Wire into
  `ReviewDispatchPlugin.server()` registration.
  Files: `.opencode/plugins/review-dispatch/index.ts`

## 2. Dual-Copy Sync

- [ ] 2.1 Sync scaffolded copy to canonical. Verify
  byte-identical.
  Files: `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`

## 3. Tests

- [ ] 3.1 [P] Create `fetch-pr-review-context.test.ts`
  with test cases:
  - Returns structured output for valid PR
  - Saves diff to temp file with correct permissions
  - Pre-computes input_context and changed_files
  - Pre-computes exceeds_threshold correctly
  - Pre-computes ci_pending correctly
  - Returns error when gh CLI not found
  - Returns error when gh auth fails
  - Returns error when PR not found
  - Includes existing reviews and inline comments
  Files: `.opencode/test/fetch-pr-review-context.test.ts`

- [ ] 3.2 [P] Update `scratch-smoke.test.ts` to verify
  `fetch_pr_review_context` appears in the registered
  tool list.
  Files: `.opencode/test/scratch-smoke.test.ts`

- [ ] 3.3 [P] Update `plugin-integration.test.ts` to
  verify `fetch_pr_review_context` appears in the
  registered tool list.
  Files: `.opencode/test/plugin-integration.test.ts`

## 4. Verification

- [ ] 4.1 Run `make plugin-test` — all tests pass,
  branch coverage >= 85%.

- [ ] 4.2 Run `make check` — full CI parity.

- [ ] 4.3 Verify constitution alignment.
