<!--
  [P] marks tasks eligible for parallel execution.
-->

## 1. Tool Implementation

- [x] 1.1 Define `FetchPrReviewContextInputSchema` with
  Zod validation: `pr_number` (positive integer).
  Files: `.opencode/plugins/review-dispatch/index.ts`

- [x] 1.2 Implement `fetchPrReviewContext()` function.
  Files: `.opencode/plugins/review-dispatch/index.ts`
  Sub-tasks:
  - [x] 1.2a Validate `gh` CLI availability and auth
    status via BunShell (FR-004). Fail fast with
    `gh_not_found` or `gh_auth_failed`.
  - [x] 1.2b Fetch PR metadata (`gh pr view --json`)
    and map to output schema fields (FR-003).
  - [x] 1.2c Fetch CI checks (`gh pr checks --json`)
    and map to `ci_checks` array (FR-005, D5).
  - [x] 1.2d Fetch diff (`gh pr diff`), save to temp
    file with `0o600` permissions and `O_EXCL`
    semantics (FR-005).
  - [x] 1.2e Fetch existing reviews and inline comments
    via `gh api` (FR-003, D6).
  - [x] 1.2f Pre-compute `input_context`,
    `changed_files`, `exceeds_threshold`, `ci_pending`
    (FR-006).
  - [x] 1.2g Populate `warnings` array per FR-010
    conditions.
  - [x] 1.2h Wire structured error handling for all
    error codes in FR-007 (including `timeout`,
    `rate_limited`, `partial_failure`).

- [x] 1.3 Implement `createFetchPrReviewContextTool()`
  factory function. Wire into
  `ReviewDispatchPlugin.server()` registration.
  Files: `.opencode/plugins/review-dispatch/index.ts`

## 2. Dual-Copy Sync

- [x] 2.1 Sync scaffolded copy to canonical. Verify
  byte-identical.
  Files: `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`

## 3. Tests

- [x] 3.1 [P] Create `fetch-pr-review-context.test.ts`
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
  - Populates warnings for ci_pending and
    exceeds_threshold conditions (FR-010)
  - Rejects command-injection payloads in pr_number
    (security: input validation)
  - Verifies temp file created with `0o600` permissions
    (security: file permissions)
  - Exercises all error codes: `gh_not_found`,
    `gh_auth_failed`, `pr_not_found`, `api_error`,
    `timeout`, `rate_limited`, `partial_failure`
    (security: error code completeness)
  Files: `.opencode/test/fetch-pr-review-context.test.ts`

- [x] 3.2 [P] Update `scratch-smoke.test.ts` to verify
  `fetch_pr_review_context` appears in the registered
  tool list.
  Files: `.opencode/test/scratch-smoke.test.ts`

- [x] 3.3 [P] Update `plugin-integration.test.ts` to
  verify `fetch_pr_review_context` appears in the
  registered tool list.
  Files: `.opencode/test/plugin-integration.test.ts`

## 4. Verification

- [x] 4.1 Run `make plugin-test` — all tests pass,
  branch coverage >= 85%.

- [x] 4.2 Run `make check` — full CI parity.

- [x] 4.3 Verify constitution alignment.

- [x] 4.4 Documentation gate: verify user-facing changes
  have a corresponding documentation issue filed (per
  AGENTS.md documentation gate rule). File an issue if
  the tool introduces new user-facing behavior.

<!-- spec-review: passed -->
<!-- code-review: passed -->
