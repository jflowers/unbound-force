## ADDED Requirements

### Requirement: No Terminal Writes from Plugin Tools

uf-workflow and uf-finale tool handlers MUST NOT write to
the stdout or stderr of the opencode server process (via
console.log, console.error, console.info, or equivalent)
during tool execution, because the server terminal is shared
with the TUI's alternate-screen rendering. All tool output
MUST be returned through the structured JSON result envelope.

#### Scenario: Git operation tool executes

- **GIVEN** the TUI is rendering on the shared terminal
- **WHEN** a uf-workflow git tool (git_fetch, git_push,
  git_push_force_with_lease, git_merge, git_merge_abort,
  git_rebase, git_rebase_abort, git_conflict_files, or
  git_commit_no_edit) executes
- **THEN** the captured subprocess output MUST be conveyed
  only in the tool result envelope, and no bytes MUST be
  written to the process terminal

#### Scenario: Finale tool executes

- **GIVEN** the TUI is rendering on the shared terminal
- **WHEN** a uf-finale tool (startup, stage, commit_context,
  push_state, pr_context, create_pr, ci_poll, or
  return_to_main) executes
- **THEN** its captured git/gh output and summaries MUST be
  conveyed only in the tool result envelope, and no bytes
  MUST be written to the process terminal

#### Scenario: Tool subprocess fails

- **GIVEN** a git/gh subprocess invoked by a plugin tool
  exits non-zero
- **WHEN** the tool handler builds its result
- **THEN** the error message MUST be conveyed via the
  failure envelope, not via console.error

#### Scenario: CI poll iteration completes with checks
still pending

- **GIVEN** uf_finale_ci_poll is polling pending CI checks
- **WHEN** a polling iteration completes and checks are
  still pending
- **THEN** no progress message MUST be written to the
  terminal; only the final result envelope conveys check
  status

### Requirement: Stage Envelope Includes Staged File List

The uf_finale_stage success result envelope MUST include a
`files` array of staged file paths, so the staged file list
is machine-parseable rather than console-only.

#### Scenario: Files are staged

- **GIVEN** the working tree has staged changes
- **WHEN** uf_finale_stage executes successfully
- **THEN** the result envelope MUST contain a `files` array
  listing every staged file path

#### Scenario: No files are staged

- **GIVEN** the working tree has no staged changes
- **WHEN** uf_finale_stage executes successfully
- **THEN** the result envelope MUST contain a `files` array
  that is empty

### Requirement: Embedded Assets Mirror Live Plugins

Any edit to the live plugin sources
(.opencode/plugins/uf-workflow/index.ts,
.opencode/plugins/uf-finale/index.ts) MUST be mirrored
byte-identically in the embedded scaffold copies
(internal/scaffold/assets/opencode/plugins/...) within the
same change, as enforced by the drift-detection tests.

#### Scenario: Drift detection runs after the edit

- **GIVEN** the live plugin files have been modified
- **WHEN** the repository's drift-detection tests execute
  (the Go suite run by make test / make check)
- **THEN** the embedded copies MUST match the live copies,
  otherwise the tests fail

## MODIFIED Requirements

None -- no existing capability spec covers plugin tool
output behavior.

## REMOVED Requirements

None.
