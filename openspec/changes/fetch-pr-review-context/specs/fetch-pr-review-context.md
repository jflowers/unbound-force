## ADDED Requirements

### Requirement: FR-001 fetch_pr_review_context tool

The review-dispatch plugin MUST register a
`fetch_pr_review_context` tool that fetches all PR metadata
needed for review dispatch in one deterministic call.

### Requirement: FR-002 Input schema

The tool MUST accept:

- `pr_number` (number, required): Positive integer PR
  number (1–999999).

#### Scenario: Valid PR number

- **GIVEN** PR #686 exists on the current repository
- **WHEN** `fetch_pr_review_context` is called with
  `pr_number: 686`
- **THEN** the tool returns structured metadata for PR #686

### Requirement: FR-003 Output schema

The tool MUST return a JSON object with shape:

```
{
  pr_number: number,
  title: string,
  body: string,
  base_ref: string,
  base_sha: string,
  head_ref: string,
  head_sha: string,
  files: Array<{ path: string, additions: number, deletions: number }>,
  diff_path: string,
  diff_lines: number,
  diff_bytes: number,
  exceeds_threshold: boolean,
  ci_checks: Array<{ name: string, status: string, conclusion: string | null }>,
  ci_pending: boolean,
  existing_reviews: Array<{
    author: string,
    state: string,
    body: string,
    submitted_at: string
  }>,
  inline_comments: Array<{
    author: string,
    path: string,
    line: number | null,
    body: string
  }>,
  input_context: string,
  changed_files: string,
  warnings: string[]
}
```

> **Trust boundary**: Fields derived from `gh` CLI output
> (`title`, `body`, `author`, `existing_reviews`,
> `inline_comments`) contain untrusted user input.
> Consumers MUST treat these fields as unsanitized and
> MUST NOT interpolate them into shell commands, prompts,
> or HTML without appropriate escaping.

#### Scenario: Complete output

- **GIVEN** a PR with CI checks, reviews, and inline comments
- **WHEN** `fetch_pr_review_context` succeeds
- **THEN** all fields are populated and `diff_path` points
  to a readable file on disk

### Requirement: FR-004 gh CLI validation

The tool MUST validate `gh` CLI availability and
authentication before making API calls.

- If `gh` is not found: return error with code
  `gh_not_found` and message suggesting installation.
- If `gh auth status` fails: return error with code
  `gh_auth_failed` and the auth status output.

#### Scenario: gh CLI not installed

- **GIVEN** `gh` is not in PATH
- **WHEN** `fetch_pr_review_context` is called
- **THEN** returns error `gh_not_found`

### Requirement: FR-005 Diff file persistence

The tool MUST save the complete PR diff to a temp file at
`$TMPDIR/opencode/pr-<number>-diff.patch` with permissions
`0o600`. The tool MUST create parent directories if needed
with permissions `0o700`. The temp file MUST be created
with `O_EXCL` semantics (exclusive create, fail if exists)
or equivalent to prevent symlink/TOCTOU attacks.

#### Scenario: Diff saved to disk

- **GIVEN** PR #686 has a 50 KB diff
- **WHEN** `fetch_pr_review_context` succeeds
- **THEN** `diff_path` points to a file containing the
  complete diff content

### Requirement: FR-006 Pre-computed fields

The tool MUST pre-compute these fields from raw PR data:

- `input_context`: formatted string containing kind, PR
  number, base/head refs and SHAs
- `changed_files`: formatted list of changed files with
  additions/deletions counts
- `exceeds_threshold`: true when diff exceeds 1500 lines
  (the size advisory threshold from command files)
- `ci_pending`: true when any CI check has `status` not
  equal to `completed`

### Requirement: FR-007 Error handling

The tool MUST return structured errors for:
- `gh` CLI not found (`gh_not_found`)
- `gh` authentication failure (`gh_auth_failed`)
- PR not found (`pr_not_found`)
- API/network errors (`api_error`)
- `gh` CLI call timeout (`timeout`)
- GitHub API rate limit exceeded (`rate_limited`)

Errors MUST include `retryable: boolean`. The `timeout`
and `rate_limited` codes MUST set `retryable: true`.

Partial data retrieval failures (e.g., CI checks succeed
but reviews fetch fails) are handled via graceful
degradation: the tool returns a successful result with
the degraded field set to its empty default and a warning
appended to the `warnings` array identifying which
sub-call failed. This approach provides better UX than a
discrete `partial_failure` error code because consumers
receive all available data rather than a blanket failure.

#### Scenario: PR not found

- **GIVEN** PR #999999 does not exist
- **WHEN** `fetch_pr_review_context` is called
- **THEN** returns error `pr_not_found` with
  `retryable: false`

### Requirement: FR-008 Tool registration

The tool MUST be registered in
`ReviewDispatchPlugin.server()` alongside existing tools.

### Requirement: FR-009 Dual-copy sync

The tool implementation MUST be maintained in both
`.opencode/plugins/review-dispatch/index.ts` and
`internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`.
Both copies MUST be byte-identical.

### Requirement: FR-010 Structured warnings

The tool MUST populate the `warnings` array in the output
when non-fatal issues are detected during execution:

- When `ci_pending` is true: include a warning with
  message indicating CI checks are still in progress.
- When `exceeds_threshold` is true: include a warning
  noting the diff exceeds the size advisory threshold.
- When any `gh` sub-call returns partial data (e.g.,
  reviews fetch succeeds but inline comments fail): include
  a warning identifying the degraded field.

Warnings MUST be human-readable strings. An empty array
indicates no warnings.

#### Scenario: CI checks pending warning

- **GIVEN** PR #100 has CI checks with `status: in_progress`
- **WHEN** `fetch_pr_review_context` succeeds
- **THEN** `warnings` contains a string matching
  "CI checks are still in progress"

#### Scenario: Diff exceeds threshold warning

- **GIVEN** PR #200 has a diff exceeding 1500 lines
- **WHEN** `fetch_pr_review_context` succeeds
- **THEN** `warnings` contains a string matching
  "Diff exceeds size advisory threshold"

## MODIFIED Requirements

### Requirement: Command file Steps 0-3.5

Previously: Each command file contained step-by-step bash
sequences for `gh` CLI calls with LLM-interpreted output.

Modified: Command files SHOULD call
`fetch_pr_review_context` for Steps 0-3.5. Commands retain
responsibility for pre-flight checks (Step 3.7), review
context discovery (Step 3.8), and convention pack loading
(Step 3.9).

Note: Command file updates are tracked independently from
this tool implementation.

## REMOVED Requirements

None.

## Coverage Strategy

The testing approach for this tool follows three tiers:

1. **Unit tests** (one per FR): Each functional requirement
   has at least one dedicated test case verifying its
   acceptance scenario. FR-002 validates input rejection;
   FR-003 validates output shape; FR-004 validates `gh`
   CLI detection; FR-005 validates file permissions and
   `O_EXCL` semantics; FR-006 validates pre-computed
   fields; FR-007 validates each error code; FR-010
   validates warning population.

2. **Smoke tests**: Verify tool registration appears in
   the plugin's tool list (`scratch-smoke.test.ts` and
   `plugin-integration.test.ts`).

3. **Spec-level expectations**: Branch coverage >= 85%
   for the tool implementation. All error paths MUST be
   exercised. All warning conditions MUST be exercised.
   Security-specific cases (command injection resistance,
   file permission verification) MUST be included.
