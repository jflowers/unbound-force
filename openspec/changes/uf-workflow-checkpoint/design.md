## Context

Six UF command files track progress by editing checkboxes
into their own source files or appending HTML markers to
spec artifacts. This creates source file mutation,
artifact pollution, and fragmented per-command state
management (see proposal.md for full motivation).

The `uf.address-feedback` command already uses an external
state file at `.uf/feedback/pr-<N>/state.json`, proving
the pattern works. This design generalizes that approach
into a shared plugin tool.

## Goals / Non-Goals

### Goals
- Unified progress tracking for all UF commands via a
  new `uf-workflow` plugin with `checkpoint`,
  `get_progress`, and `clear_progress` tools
- Branch-scoped state keying with explicit override
  for PR-scoped commands
- Data merge semantics so each step can store
  intermediate results without overwriting prior data
- Clean resume: commands call `get_progress` at start,
  skip completed steps, continue from current step
- File-permission-safe state storage in `.uf/progress/`

### Non-Goals
- Orchestration or step execution — the tools only
  track state; commands still control their own flow
- Cross-session locking or concurrency control
- State migration from existing checkpoint patterns —
  old HTML markers and checkbox logic are simply removed
- Automatic state expiration or cleanup beyond
  `clear_progress`

## Decisions

### D1: Extend existing `uf-workflow` plugin

The `uf-workflow` plugin already exists (created by
the `uf-workflow-scaffold` change) and contains the
`resolve_base_ref` tool. Adding checkpoint tools here
keeps workflow-related tools co-located and avoids
the 2700+ line `review-dispatch` plugin. This aligns
with Constitution Principle II (Composability First).

The plugin is already registered in `opencode.json`
and scaffolded to `internal/scaffold/assets/`.

### D2: Branch + command as state key

State files are stored at
`.uf/progress/<key>/<command>.json` where `<key>` is a
sanitized branch name by default. Commands that are
PR-scoped (e.g., `uf.review-pr`, `uf.address-feedback`)
pass `key: "pr-<N>"` explicitly.

Branch name sanitization: replace `/` with `-`, strip
characters outside `[a-zA-Z0-9._-]`, truncate to 100
characters.

**Rationale**: Most workflows are branch-scoped (unleash,
finale). PR-scoped commands already know their PR number
and can pass it. This avoids requiring callers to
construct keys manually in the common case.

### D3: Merge semantics for step data

The `checkpoint` tool merges its `data` parameter into
the existing state's `data` object using shallow merge
(`Object.assign`). This allows each step to contribute
its own data (e.g., `feature_dir`, `pr_number`,
`iteration_count`) without overwriting data from prior
steps.

**Example**: Step "init" stores `{ spec_type: "openspec" }`,
step "plan" stores `{ feature_dir: "openspec/changes/x" }`.
After both, data contains both fields.

### D4: Ordered completed_steps array

Completed steps are stored as an ordered array, not a
set. This preserves execution order for diagnostics and
enables `get_progress` to report both the last completed
step and the full sequence.

### D5: No data schema enforcement

The `data` field accepts arbitrary JSON objects. Each
command defines its own data shape. This avoids coupling
the plugin to specific command implementations and keeps
the tool generic.

### D6: `.uf/progress/` added to `.gitignore`

Progress state is transient workflow metadata, not
repository content. It MUST NOT be committed. The
existing `.uf/feedback/` is already gitignored;
`.uf/progress/` follows the same convention.

### D7: File permissions follow security-by-default

State files: `0o600`. Directories: `0o700`. Consistent
with `review-dispatch` plugin's file permission handling
and Constitution Principle V (Security by Default).

## Tool Interface

### `checkpoint`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `command` | string | yes | Command name (e.g., `uf.unleash`) |
| `step` | string | yes | Step name (e.g., `plan`, `implement`) |
| `data` | object | no | Arbitrary JSON merged into state |
| `key` | string | no | Override key (default: auto-detect branch) |

**Returns**: Updated state object.

### `get_progress`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `command` | string | yes | Command name |
| `key` | string | no | Override key (default: auto-detect branch) |

**Returns**: Full state object or `null` if no prior run.

### `clear_progress`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `command` | string | yes | Command name |
| `key` | string | no | Override key (default: auto-detect branch) |

**Returns**: Confirmation string.

## State File Schema

```json
{
  "command": "uf.unleash",
  "branch": "opsx/my-feature",
  "key": "opsx-my-feature",
  "current_step": "implement",
  "completed_steps": [
    "init", "clarify", "plan", "tasks",
    "spec-review", "pre-flight"
  ],
  "data": {
    "spec_type": "openspec",
    "feature_dir": "openspec/changes/my-feature",
    "spec_review_iteration": 2
  },
  "created_at": "2026-10-12T10:00:00.000Z",
  "updated_at": "2026-10-12T11:30:00.000Z"
}
```

## Command Step Definitions

Each command defines named steps for checkpointing:

| Command | Steps |
|---------|-------|
| `uf.unleash` | startup-cleanup, branch-safety-gate, resumability-detection, clarify, plan, tasks, spec-review, implement, code-review, retrospective, demo |
| `uf.finale` | check-changes, commit, push, create-pr, conflict-option, watch-ci, return-to-main, summary |
| `uf.review-council` | phase-1a-preflight, phase-1b-gaze, phase-1c-context, divisor-dispatch, finding-consolidation, fix-loop, iteration-limit-check, final-report, pr-detection, review-state-fetch, pre-posting-checks, finding-aggregation, inline-comment-prep, human-confirmation, post-review |
| `uf.review-pr` | init, pre-flight, context, dispatch, aggregate, post |
| `uf.triage-issue` | init, context, dispatch, aggregate, post, artifact |
| `uf.address-feedback` | ingest, assess, triage, commits, review-council, push, reply-comments |

## Command Integration Pattern

```markdown
<!-- At command start -->
1. Call get_progress("uf.unleash")
2. If state exists, report resume point and skip
   completed steps
3. Initialize TodoWrite from checkpoint state

<!-- After each significant step -->
checkpoint("uf.unleash", "plan", { feature_dir: "..." })
Mark TodoWrite item completed

<!-- At successful completion -->
clear_progress("uf.unleash")
```

## Risks / Trade-offs

- **Stale state files**: If a branch is deleted without
  completing the command, orphan state files remain in
  `.uf/progress/`. Acceptable: the directory is
  gitignored and can be cleaned manually. A future
  `clear_all_progress` tool could address this.

- **Branch detection in detached HEAD**: `git rev-parse
  --abbrev-ref HEAD` returns `HEAD` when detached.
  The tool will require an explicit `key` parameter in
  this case. Commands that operate on known branches
  (unleash, finale) will not encounter this.

- **Shallow data merge**: `Object.assign` does not deep
  merge nested objects. Commands that need complex nested
  data should pass the full updated structure. This is
  acceptable for the current use cases where data fields
  are flat key-value pairs.

- **Gatekeeping reclassification**: This change replaces
  HTML comment markers (`<!-- spec-review: passed -->`,
  `<!-- code-review: passed -->`) in tasks.md with
  structured JSON state files. The replacement preserves
  equivalent gate strength: both are checked by the
  `/uf.unleash` resumability detection (Step 2) and
  neither is committed to the repository. The JSON
  approach adds provenance (timestamps, step history)
  that the marker approach lacked.
