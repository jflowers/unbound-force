## Why

Six UF command files (`uf.unleash`, `uf.finale`,
`uf.review-council`, `uf.review-pr`, `uf.triage-issue`,
`uf.address-feedback`) track progress by editing checkboxes
into their own markdown source or by appending HTML comment
markers into spec artifact files. When a session is
interrupted and resumes, the agent must re-read the
modified command file or scan artifact files for
filesystem markers to reconstruct progress.

This creates three problems:

1. **Source file mutation**: Commands edit themselves
   (`[x]` checkbox marking via Edit tool), requiring
   restoration at completion. The agent must remember to
   undo these edits, and failures leave dirty source files.

2. **Artifact pollution**: HTML comment markers like
   `<!-- spec-review: passed -->` are appended to
   `tasks.md`, coupling workflow state to content files.

3. **Fragmentation**: Each command invents its own state
   tracking — `uf.address-feedback` uses
   `.uf/feedback/pr-<N>/state.json`, while others rely on
   in-file checkboxes. There is no shared mechanism.

A dedicated plugin tool that writes structured state to
`.uf/progress/` eliminates all three problems with a
unified, external, command-file-clean approach.

## What Changes

A new `uf-workflow` OpenCode plugin provides three tools
for workflow progress tracking:

- **`checkpoint`**: Records a completed step with optional
  data payload. Auto-detects git branch as the state key.
- **`get_progress`**: Reads the current progress state for
  a command, enabling clean resume detection.
- **`clear_progress`**: Deletes the state file on
  successful completion.

All six command files are updated to use these tools
instead of editing their own checkboxes or writing
HTML markers into artifact files.

## Capabilities

### New Capabilities
- `checkpoint`: Record workflow step completion with
  optional structured data, keyed by branch + command
- `get_progress`: Query saved progress state for resume
  detection at command start
- `clear_progress`: Remove progress state on successful
  workflow completion

### Modified Capabilities
- `uf.unleash`: Replace checkbox editing and HTML marker
  insertion with checkpoint calls
- `uf.finale`: Replace checkbox editing with checkpoint
  calls
- `uf.review-council`: Replace checkbox editing with
  checkpoint calls
- `uf.review-pr`: Add checkpoint calls for step tracking
- `uf.triage-issue`: Add checkpoint calls for step tracking
- `uf.address-feedback`: Replace ad-hoc
  `.uf/feedback/pr-<N>/state.json` with checkpoint calls

### Removed Capabilities
- In-file checkbox editing for progress tracking
  (replaced by external state file)
- HTML comment markers in artifact files for gate
  tracking (replaced by checkpoint data field)

## Impact

- **New files**: `.opencode/plugins/uf-workflow/index.ts`,
  scaffolded copy, test file
- **Config**: `opencode.json` plugin array (add entry),
  `.gitignore` (add `.uf/progress/`)
- **Command files**: All six UF commands updated
- **Scaffold sync**: New scaffolded copy +
  `scaffold_test.go` drift detection
- **Test surface**: `scratch-smoke.test.ts` updated for
  new plugin tool registration

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The checkpoint tool produces self-describing JSON
artifacts in `.uf/progress/` containing command identity,
branch, step names, timestamps, and structured data.
These files can be read by any agent or tool without
consulting the producing command. No runtime coupling
between commands is introduced.

### II. Composability First

**Assessment**: PASS

The `uf-workflow` plugin is independently installable.
Commands that do not use it continue to function
unchanged. Commands that adopt it gain resume
capability without requiring any other plugin. The
plugin has no dependencies on `invoke-agent` or
`review-dispatch`.

### III. Observable Quality

**Assessment**: PASS

Progress state files are machine-parseable JSON with
full provenance (command name, branch, timestamps,
step sequence). The `get_progress` query tool
enables programmatic inspection of workflow state.

### IV. Testability

**Assessment**: PASS

All three tools are pure functions of inputs + file
system state, testable in isolation using temporary
directories. No external services, network access, or
shared mutable state required. The existing
`vitest` + `@vitest/coverage-v8` infrastructure covers
unit and integration testing.

### V. Security by Default

**Assessment**: PASS

State files are written with restrictive permissions
(0o600 files, 0o700 directories). Branch names are
sanitized to filesystem-safe slugs before use in paths.
No new external dependencies are introduced.
