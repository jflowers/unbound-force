## ADDED Requirements

### Requirement: FR-001 fetch_pr_review_context tool

The review-dispatch plugin MUST register a
`fetch_pr_review_context` tool that fetches all PR metadata
needed for review dispatch in one deterministic call.

### Requirement: FR-002 Input schema

The tool MUST accept:

- `pr_number` (number, required): Positive integer PR number.

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
with permissions `0o700`.

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

Errors MUST include `retryable: boolean`.

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
