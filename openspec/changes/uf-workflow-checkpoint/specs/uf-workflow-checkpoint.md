## ADDED Requirements

### FR-001: checkpoint tool

The `uf-workflow` plugin MUST provide a `checkpoint` tool
that records a completed workflow step to persistent
storage.

**Inputs**:
- `command` (string, required): Command identifier
- `step` (string, required): Step name
- `data` (object, optional): Arbitrary JSON merged into
  state via shallow merge
- `key` (string, optional): Override state key; defaults
  to sanitized current git branch

**Behavior**: The tool MUST append `step` to the
`completed_steps` array, set `current_step` to `step`,
merge `data` into the existing data object, and update
`updated_at`. If no prior state exists, it MUST create
a new state file.

**Output**: The tool MUST return the updated state object
as JSON.

#### Scenario: First checkpoint in a workflow
- **GIVEN** no prior state exists for command `uf.unleash`
  on the current branch
- **WHEN** `checkpoint("uf.unleash", "init",
  { spec_type: "openspec" })` is called
- **THEN** a state file is created at
  `.uf/progress/<sanitized-branch>/uf.unleash.json`
  with `completed_steps: ["init"]`,
  `current_step: "init"`, and
  `data: { spec_type: "openspec" }`

#### Scenario: Subsequent checkpoint with data merge
- **GIVEN** state exists with
  `data: { spec_type: "openspec" }`
- **WHEN** `checkpoint("uf.unleash", "plan",
  { feature_dir: "openspec/changes/x" })` is called
- **THEN** `completed_steps` becomes `["init", "plan"]`,
  `current_step` becomes `"plan"`, and `data` becomes
  `{ spec_type: "openspec",
  feature_dir: "openspec/changes/x" }`

#### Scenario: Duplicate step is idempotent
- **GIVEN** state exists with
  `completed_steps: ["init", "plan"]`
- **WHEN** `checkpoint("uf.unleash", "plan")` is called
  again
- **THEN** `completed_steps` remains `["init", "plan"]`
  (no duplicate entry) and `current_step` remains
  `"plan"`

### FR-002: get_progress tool

The `uf-workflow` plugin MUST provide a `get_progress`
tool that reads the current progress state for a command.

**Inputs**:
- `command` (string, required): Command identifier
- `key` (string, optional): Override state key; defaults
  to sanitized current git branch

**Output**: The tool MUST return the full state object as
JSON, or a null/empty indicator if no prior state exists.

#### Scenario: Resume detection at command start
- **GIVEN** state exists for `uf.unleash` with
  `completed_steps: ["init", "clarify", "plan"]`
- **WHEN** `get_progress("uf.unleash")` is called
- **THEN** the returned state includes
  `current_step: "plan"`,
  `completed_steps: ["init", "clarify", "plan"]`,
  and all stored data

#### Scenario: No prior state
- **GIVEN** no state exists for `uf.finale` on the
  current branch
- **WHEN** `get_progress("uf.finale")` is called
- **THEN** the tool returns a null/empty indicator

### FR-003: clear_progress tool

The `uf-workflow` plugin MUST provide a `clear_progress`
tool that removes the state file on successful workflow
completion.

**Inputs**:
- `command` (string, required): Command identifier
- `key` (string, optional): Override state key; defaults
  to sanitized current git branch

**Output**: The tool MUST return a confirmation string.
If no state file exists, the tool MUST succeed silently
(idempotent delete).

#### Scenario: Cleanup after successful completion
- **GIVEN** state exists for `uf.unleash`
- **WHEN** `clear_progress("uf.unleash")` is called
- **THEN** the state file is deleted and the tool returns
  a confirmation

#### Scenario: Cleanup when no state exists
- **GIVEN** no state exists for `uf.finale`
- **WHEN** `clear_progress("uf.finale")` is called
- **THEN** the tool returns a confirmation without error

### FR-004: Branch auto-detection

When no `key` parameter is provided, all three tools
MUST auto-detect the current git branch via
`git rev-parse --abbrev-ref HEAD` and sanitize it to a
filesystem-safe slug.

**Sanitization rules** (applied to both auto-detected
branch names and explicit `key` values):
- Replace `/` with `-`
- Remove characters outside `[a-zA-Z0-9._-]`
- Truncate to 100 characters
- If the result is `HEAD` (detached), the tool MUST
  return an error requiring an explicit `key` parameter

The `command` parameter MUST also be sanitized using
the same rules before path construction. Both `key`
and `command` are used to build file paths and MUST
be treated as untrusted input.

**Security invariant**: Commands MUST NOT store secrets,
tokens, or credentials in checkpoint data. State files
are unencrypted JSON on the local filesystem.

#### Scenario: Branch name sanitization
- **GIVEN** the current branch is `opsx/my-feature`
- **WHEN** any tool is called without a `key` parameter
- **THEN** the resolved key is `opsx-my-feature`

#### Scenario: Detached HEAD requires explicit key
- **GIVEN** the repository is in detached HEAD state
- **WHEN** any tool is called without a `key` parameter
- **THEN** the tool returns an error with a message
  indicating that an explicit `key` is required

### FR-005: File permissions and path safety

State directories MUST be created with mode `0o700`.
State files MUST be written with mode `0o600`.

Path construction MUST resolve the final path and
verify it remains under `.uf/progress/`. The
implementation MUST NOT follow symlinks when writing
state files. I/O errors (permission denied, disk full,
corrupt JSON on read) MUST be reported as tool errors
with actionable messages, never silently swallowed.

#### Scenario: State file has restrictive permissions
- **GIVEN** no prior state directory exists
- **WHEN** `checkpoint("uf.unleash", "init")` is called
- **THEN** the directory `.uf/progress/<key>/` is created
  with mode `0o700` and the state file is written with
  mode `0o600`

### FR-006: Plugin tool registration

The `uf-workflow` plugin is already registered in
`opencode.json` (by the `uf-workflow-scaffold` change).
The `scratch-smoke.test.ts` test MUST verify that it
registers the three new tools: `checkpoint`,
`get_progress`, `clear_progress` (in addition to the
existing `resolve_base_ref` tool).

#### Scenario: Plugin discovery
- **GIVEN** the `uf-workflow` plugin is registered in
  `opencode.json`
- **WHEN** the plugin is activated
- **THEN** the tools `checkpoint`, `get_progress`, and
  `clear_progress` are available

### FR-007: State file location

State files MUST be stored at
`.uf/progress/<key>/<command>.json` relative to the
repository root. The `.uf/progress/` path MUST be added
to `.gitignore`.

#### Scenario: State file path construction
- **GIVEN** branch `opsx/my-feature` and command
  `uf.unleash`
- **WHEN** `checkpoint` is called
- **THEN** the state file is written to
  `.uf/progress/opsx-my-feature/uf.unleash.json`

### FR-008: Scaffold synchronization

The plugin source MUST exist in both the canonical
location (`.opencode/plugins/uf-workflow/index.ts`) and
the scaffolded location
(`internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`).
The `TestEmbeddedAssets_MatchSource` test MUST verify
byte-for-byte parity.

## MODIFIED Requirements

### Requirement: uf.unleash progress tracking

Commands MUST use `checkpoint` / `get_progress` /
`clear_progress` tools for progress tracking instead of
editing checkboxes in their own source files or appending
HTML comment markers to artifact files.

Previously: Commands used Edit tool to mark `[x]`
checkboxes in their markdown source and appended
`<!-- spec-review: passed -->` / `<!-- code-review:
passed -->` HTML comments to `tasks.md`.

#### Scenario: uf.unleash resume from checkpoint
- **GIVEN** `uf.unleash` was interrupted after completing
  the `plan` step
- **WHEN** `uf.unleash` is invoked in a new session
- **THEN** `get_progress("uf.unleash")` returns state
  with `completed_steps: ["init", "clarify", "plan"]`
  and the command resumes at the `tasks` step

### Requirement: uf.address-feedback state management

`uf.address-feedback` MUST use the `checkpoint` tool
with `key: "pr-<N>"` instead of writing directly to
`.uf/feedback/pr-<N>/state.json`.

Previously: The command wrote ad-hoc JSON to
`.uf/feedback/pr-<N>/state.json` for its own caching.

#### Scenario: PR-scoped checkpoint
- **GIVEN** `uf.address-feedback` is processing PR #123
- **WHEN** the assess step completes
- **THEN** `checkpoint("uf.address-feedback", "assess",
  { items_assessed: 5 }, "pr-123")` stores state at
  `.uf/progress/pr-123/uf.address-feedback.json`

## REMOVED Requirements

### Requirement: In-file checkbox editing for progress

Commands no longer edit their own source files to track
progress. The Edit tool MUST NOT be used to modify
command file checkboxes for step tracking purposes.

Reason: Replaced by external state file via `checkpoint`
tool. Source file mutation is fragile, requires
restoration at completion, and couples progress tracking
to command file content.

### Requirement: HTML comment markers in artifact files

Commands no longer append `<!-- spec-review: passed -->`
or `<!-- code-review: passed -->` markers to artifact
files (e.g., `tasks.md`).

Reason: Replaced by `checkpoint` data field. Gate status
is stored as structured data in the progress state file
rather than as HTML comments in spec artifacts.
