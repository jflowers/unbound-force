## ADDED Requirements

### Requirement: FR-013 fetch_pr_checks tool

The review-dispatch plugin MUST register a `fetch_pr_checks` tool
that fetches `gh pr checks <N> --json name,state,bucket,link` for a
validated `pr_number`. A non-zero `gh pr checks` exit whose stdout
parses as a JSON array MUST be treated as check-status data, not a
fetch failure. Conversely, stdout that does not parse as a JSON
array MUST be treated as a fetch failure classified through the
shared error classifier, regardless of exit code — including
exit 0 with unparseable stdout. The tool MUST derive an
`eligibility` classification
from the observed `bucket` values: `failing` when any check buckets
as `fail`, `pending` when none fail but any buckets as `pending`,
`cancel`, or an unknown value, and `passing` otherwise. Unknown
bucket values MUST also append a warning.

#### Scenario: Failing checks return data on a non-zero exit

- **GIVEN** PR 42 has one check with `bucket: "fail"` and `gh pr
  checks` exits non-zero with a JSON array on stdout
- **WHEN** `fetch_pr_checks` is called with `pr_number: 42`
- **THEN** the tool returns the full checks array with each check's
  `name`, `state`, `bucket`, and `link`
- **AND** `eligibility` is `failing`

#### Scenario: Green PR reports passing eligibility

- **GIVEN** PR 42's checks all bucket as `pass` or `skipping`
- **WHEN** `fetch_pr_checks` is called
- **THEN** `eligibility` is `passing` and every check appears in
  the returned array

#### Scenario: Pending checks report pending eligibility

- **GIVEN** PR 42 has no failing check but one with
  `bucket: "pending"`
- **WHEN** `fetch_pr_checks` is called
- **THEN** `eligibility` is `pending`

#### Scenario: Unknown bucket classifies fail-closed

- **GIVEN** a check returns a bucket value outside `pass`, `fail`,
  `pending`, `skipping`, and `cancel`
- **WHEN** `fetch_pr_checks` derives eligibility
- **THEN** `eligibility` is `pending` and a warning names the
  unknown bucket value

#### Scenario: Unparseable stdout is a fetch failure

- **GIVEN** `gh pr checks` exits with any code (including 0) and
  stdout that does not parse as a JSON array
- **WHEN** `fetch_pr_checks` is called
- **THEN** the tool returns a structured error classified through
  the shared error classifier (for example `api_error`), not a
  checks payload

### Requirement: FR-014 fetch_failed_run_logs tool

The review-dispatch plugin MUST register a `fetch_failed_run_logs`
tool that fetches `gh run view <run_id> --log-failed` for a
`run_id` matching `^[0-9]+$`, optionally anchored with
`--repo <owner/repo>`. The log text MUST be persisted to
`$TMPDIR/opencode/run-<run_id>-failed-logs.txt` with `0o600`
permissions, `O_EXCL` semantics, and a `0o700` parent directory.
The tool MUST return `run_id`, `repo`, `log_path`, `log_bytes`,
`log_lines`, and `warnings` — never the log text inline — and MUST
append a warning when the fetch succeeds but produces zero log
lines. A missing run MUST return a `run_not_found` error.

#### Scenario: Failed-run logs persist to a temp file

- **GIVEN** run 40908825770 has failed-step logs
- **WHEN** `fetch_failed_run_logs` is called with
  `run_id: "40908825770"`
- **THEN** `log_path` points to a readable file containing the
  `--log-failed` output with `0o600` permissions
- **AND** `log_bytes` and `log_lines` reflect the persisted content

#### Scenario: Repo anchoring on fork checkouts

- **GIVEN** the caller passes `repo: "unbound-force/unbound-force"`
- **WHEN** `fetch_failed_run_logs` executes
- **THEN** the `gh run view` invocation carries
  `--repo unbound-force/unbound-force` so remote resolution does
  not depend on the local checkout

#### Scenario: Run not found

- **GIVEN** no run with the given id exists (or its logs expired)
- **WHEN** `fetch_failed_run_logs` is called
- **THEN** the tool returns error `run_not_found` with the gh error
  surfaced and `retryable: false`

#### Scenario: Empty log output warns

- **GIVEN** the run exists and `--log-failed` succeeds but writes
  no log lines
- **WHEN** `fetch_failed_run_logs` is called
- **THEN** the call succeeds with `log_lines: 0`
- **AND** a warning identifies the empty fetch

#### Scenario: Input validation rejects unsafe values

- **GIVEN** a caller passes `run_id: "40908825770; rm -rf /"` or a
  `repo` that is not an `owner/repo` pair
- **WHEN** the tool validates input
- **THEN** the schema rejects the value before any `gh` invocation

### Requirement: FR-015 /uf.fix-ci fetch re-routing

The `/uf.fix-ci` command (canonical copy and scaffold mirror) MUST
route its PR-state, check-suite, and failure-log fetches through
`fetch_pr_review_context`, `fetch_pr_checks`, and
`fetch_failed_run_logs` respectively. Phase 1.0's gh availability
prose MUST collapse into the tools' own validation; Phase 1.1's
auto-detect MUST call `fetch_pr_review_context` without
`pr_number`; Phase 1.2's eligibility gate MUST key on the derived
`eligibility`; Phase 2.1's `mktemp` plus `gh run view` MUST be
replaced by `fetch_failed_run_logs`. Run-id derivation (Phase 2.0)
and the git choreography (Phases 1.3 and 1.4) remain command prose.
The uf-fix-ci change's raw-gh deviation records — design D1's
fetch-class inventory entry and spec FR-001 (the gh-availability
verification whose "before any other step" sequencing the tools'
own validation now owns), FR-002, FR-003, FR-010 — MUST be
updated to the tool-routed wording.

#### Scenario: Phase 1 fetches execute through the tools

- **GIVEN** `/uf.fix-ci 42` is invoked on an open PR with failing
  checks
- **WHEN** Phase 1 executes
- **THEN** PR state comes from `fetch_pr_review_context`, check
  status from `fetch_pr_checks`, and no raw `gh pr view` or
  `gh pr checks` bash block remains in the command
- **AND** the eligibility gate keys on the tool's `eligibility`
  value with identical STOP outcomes

#### Scenario: Failure logs fetch through the tool

- **GIVEN** Phase 2 diagnoses a failed check with run-id
  `40908825770` on base repository `owner/repo`
- **WHEN** Phase 2.1 fetches logs
- **THEN** it calls `fetch_failed_run_logs` with the run-id and
  `repo`, and no `mktemp` or `gh run view` bash block remains

#### Scenario: Deviation record retired

- **GIVEN** the re-route has landed
- **WHEN** a reader checks the uf-fix-ci change artifacts
- **THEN** design D1's three-raw-gh-fetch-classes entry records the
  retirement with a reference to this change
- **AND** spec FR-001, FR-002, FR-003, and FR-010 describe the
  tool-routed mechanics

### Requirement: FR-016 Dual-copy sync for extended surfaces

The review-dispatch plugin file and the `/uf.fix-ci` command file
MUST each remain byte-identical between the canonical copy and the
scaffold mirror after the extension and re-route. Existing scaffold
drift and manifest tests MUST pass without manifest changes (both
assets already ship).

#### Scenario: Plugin drift detection stays green

- **GIVEN** `.opencode/plugins/review-dispatch/index.ts` carries
  the extended tool and the two new tools
- **WHEN** `go test ./internal/scaffold/...` runs
- **THEN** the embedded-asset drift test confirms the scaffold
  mirror is byte-identical

#### Scenario: Command drift detection stays green

- **GIVEN** `.opencode/commands/uf.fix-ci.md` carries the
  tool-routed phases
- **WHEN** scaffold drift and contract tests run
- **THEN** the command mirror is byte-identical and the structural
  pin test asserts the tool-routed fetch wording on both copies

## MODIFIED Requirements

### Requirement: FR-002 Input schema

Previously: The tool MUST accept `pr_number` (number, required)
— a positive integer PR number (1–999999).

Modified: The tool MUST accept:

- `pr_number` (number, optional): Positive integer PR
  number (1–999999). When omitted, the tool MUST resolve
  the current branch's open PR by invoking `gh pr view`
  without a number and MUST report the resolved number in
  the returned `pr_number` field. When no open PR exists
  for the current branch, the tool MUST return the
  `pr_not_found` error. The schema MUST remain `.strict()`
  and reject unknown fields.

#### Scenario: Valid PR number

- **GIVEN** PR #686 exists on the current repository
- **WHEN** `fetch_pr_review_context` is called with
  `pr_number: 686`
- **THEN** the tool returns structured metadata for PR #686

#### Scenario: Omitted pr_number resolves the current branch PR

- **GIVEN** the current branch has open PR 42
- **WHEN** `fetch_pr_review_context` is called with no arguments
- **THEN** the call succeeds and the returned `pr_number` is 42

#### Scenario: No open PR for the current branch

- **GIVEN** the current branch has no open PR
- **WHEN** `fetch_pr_review_context` is called with no arguments
- **THEN** the tool returns error `pr_not_found` with
  `retryable: false`

#### Scenario: Explicit pr_number is unchanged

- **GIVEN** a caller passes `pr_number: 42`
- **WHEN** the tool executes
- **THEN** it fetches PR 42 exactly as before the input became
  optional, and `.strict()` schema validation still rejects
  unknown fields

### Requirement: FR-003 Output schema

Previously: The tool returned a JSON object without the
PR-repair fields — no `state`, `mergeable`, `merge_state_status`,
`head_repository`, or `base_repository`.

Modified: The tool MUST return a JSON object with shape:

```
{
  pr_number: number,
  title: string,
  body: string,
  base_ref: string,
  base_sha: string,
  head_ref: string,
  head_sha: string,
  state: string,
  mergeable: string,
  merge_state_status: string,
  head_repository: string,
  base_repository: string,
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

`state`, `mergeable`, `merge_state_status`, and `head_repository`
MUST be passed through as `gh` returns them. The
`base_repository` value MUST be derived from the PR `url` (`gh pr
view --json` exposes no `baseRepository` field); fork orientation
MUST be derivable by comparing `head_repository` with
`base_repository`.

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

#### Scenario: Open PR carries repair fields

- **GIVEN** PR 42 is open with head repository `owner-fork/repo`
  and base repository `owner/repo`
- **WHEN** `fetch_pr_review_context` is called with
  `pr_number: 42`
- **THEN** `state` is `OPEN`, `mergeable` and `merge_state_status`
  carry gh's values as returned
- **AND** `head_repository` is `owner-fork/repo` and
  `base_repository` is the `owner/repo` parsed from the PR `url`

#### Scenario: Terminal PR state is observable

- **GIVEN** PR 43 is `MERGED`
- **WHEN** `fetch_pr_review_context` is called with `pr_number: 43`
- **THEN** `state` is `MERGED`, letting callers gate on terminal
  states without a separate `gh` call

#### Scenario: Unparseable url degrades with a warning

- **GIVEN** the fetched PR `url` does not parse as a base-repository
  PR URL
- **WHEN** the output is assembled
- **THEN** `base_repository` is the empty string
- **AND** a warning identifying the derivation failure is appended
  to `warnings`
