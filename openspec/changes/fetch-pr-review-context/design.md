## Context

Four review commands make 5+ sequential `gh` CLI calls to
gather PR metadata, CI checks, diff, and existing reviews.
Each call requires the LLM to interpret shell output and
decide the next step — adding 15-20 seconds of think time
for purely deterministic work. The `review-dispatch` plugin
already owns dispatch planning, agent invocation, prompt
building, and consolidation. PR context fetching is the
remaining manual step before dispatch.

## Goals / Non-Goals

### Goals
- Single tool call replaces Steps 0-3.5 of review commands
- Validate `gh` CLI and auth without LLM involvement
- Fetch PR metadata, CI checks, diff, and existing reviews
- Save diff to temp file with restrictive permissions
- Return structured JSON for immediate use by commands
- Eliminate ~15-20s of LLM think time per review session

### Non-Goals
- Replacing pre-flight checks (Step 3.7) — commands own
  `make check` execution
- Replacing review context discovery (Step 3.8) — commands
  own spec/issue linking
- Replacing convention pack loading (Step 3.9)
- Replacing dispatch (handled by `dispatch_review_runs`)
- Supporting non-GitHub PRs (Bitbucket, GitLab)

## Decisions

### D1: Tool lives in review-dispatch plugin

The tool joins the existing tools in the review-dispatch
plugin. Rationale: PR context is consumed by review
dispatch tools (`dispatch_review_runs`, `consolidate_dispatch`).
Avoids a new plugin registration.

### D2: BunShell for gh CLI calls

Uses BunShell (`input.$`) for `gh` CLI execution rather
than Node.js `child_process`. BunShell is already available
in the plugin context and provides cleaner syntax for
shell commands. Falls back to `execFile` if BunShell is
unavailable.

### D3: Diff saved to temp file, not returned inline

The diff is saved to a temp file and the path returned.
This matches the existing `dispatch_review_runs` input
schema which accepts `diff_path`. Inline diff would bloat
the tool response and consume LLM context tokens.

### D4: Structured output with pre-computed fields

The tool pre-computes fields the LLM would otherwise derive:
- `input_context`: serialized base/head ref string
- `changed_files`: formatted file list with line counts
- `exceeds_threshold`: whether diff exceeds size advisory

This eliminates the LLM's "interpret and format" step
between fetching raw data and passing it to dispatch.

### D5: CI check results as structured array

CI checks are returned as `{ name, status, conclusion }`
arrays, not raw `gh pr checks` text. Commands can directly
classify pass/fail/pending without parsing.

### D6: Existing reviews included

Fetches existing PR reviews and inline comments so the
command can pass `existing_reviews` to `dispatch_review_runs`.
This eliminates a separate `gh api` call the LLM currently
makes.

## Risks / Trade-offs

### R1: gh CLI dependency
The tool requires `gh` CLI installed and authenticated.
Mitigated by: clear error messages when `gh` is missing
or auth fails, matching current command behavior.

### R2: GitHub API rate limits
Multiple `gh` API calls in one tool execution could hit
rate limits on high-frequency usage. Mitigated by: these
are the same calls the LLM makes today, just batched.

### R3: Diff file cleanup
Temp diff files accumulate if not cleaned up. Mitigated by:
files are written to `$TMPDIR` which OS cleans periodically,
and `dispatch_review_runs` handles cleanup for session-scoped
files.
