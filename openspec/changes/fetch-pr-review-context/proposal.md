## Why

Review commands (`uf.review-pr`, `uf.review-council`) spend
Steps 0 through 3.5 making 5+ sequential bash calls to the
`gh` CLI with 15-20 seconds of LLM think time between them.
Every step is 100% deterministic:

1. `which gh` — verify CLI exists
2. `gh auth status` — verify authentication
3. `gh pr view --json ...` — fetch PR metadata
4. `gh pr checks` — fetch CI check results
5. `gh pr diff` — fetch and save the diff
6. `gh pr view --json reviews,reviewRequests` — existing
   review state

The LLM adds zero creative value between these calls. It
reads each shell output, decides what to call next (always
the same thing), and calls it. Session analysis shows 8.3s +
3.5s + 6s of think time on these steps alone.

## What Changes

A new `fetch_pr_review_context` tool in the `review-dispatch`
plugin that combines all PR metadata fetching into one
deterministic tool call.

## Capabilities

### New Capabilities
- `fetch_pr_review_context`: Accepts a PR number. Validates
  `gh` CLI availability and authentication. Fetches PR
  metadata (title, body, SHAs, files with line counts),
  CI check results, the complete diff (saved to temp file),
  and existing review state. Returns a single structured
  JSON response containing all data needed for Steps 2-3.10.

### Modified Capabilities
- Command files (`uf.review-pr`, `uf.review-council`,
  `uf.triage-issue`, `uf.address-feedback`): Replace Steps
  0-3.5 bash sequences with a single tool call. Commands
  retain responsibility for pre-flight checks (Step 3.7),
  review context discovery (Step 3.8), convention pack
  loading (Step 3.9), and dispatch.

### Removed Capabilities
- None. The tool is additive. Manual `gh` CLI calls remain
  possible but are no longer the primary path.

## Impact

- **Command files**: ~50-80 lines of step-by-step bash
  sequences replaced per command by one tool call.
- **review-dispatch plugin**: New tool registered alongside
  existing tools.
- **Dual-copy sync**: Both `.opencode/plugins/` and
  `internal/scaffold/assets/opencode/plugins/` copies.
- **Tests**: New test file for the tool + updated smoke and
  integration tests for tool count.

## Constitution Alignment

### I. Autonomous Collaboration
**Assessment**: PASS — The tool produces structured JSON
output that downstream steps consume as artifacts.

### II. Composability First
**Assessment**: PASS — The tool is optional. Commands can
still use manual `gh` CLI calls.

### III. Observable Quality
**Assessment**: PASS — Returns machine-parseable JSON with
all fields typed. Diff saved to inspectable file on disk.

### IV. Testability
**Assessment**: PASS — BunShell calls are injectable. Tests
can mock `gh` CLI responses without network access.

### V. Security by Default
**Assessment**: PASS — PR number validated as positive
integer. Diff saved with restrictive permissions. No
secrets in output.
