## Why

`/uf.finale` is 1,089 lines (~31KB / ~7,900 tokens) of LLM
instruction, most of which describes deterministic procedures
the model executes verbatim: git status checks, branch
detection, push state resolution, PR metadata gathering, CI
polling loops, and a 6-step model name normalization algorithm.
These consume context tokens without benefiting from LLM
reasoning.

This is Phase 3 of the Token Reduction epic (#659). Phase 2
established the `uf-workflow` plugin scaffold. This change
populates it with shared git primitives and a new `uf-finale`
plugin, then rewrites the command to ~300 lines (~70% reduction).

A secondary goal is plugin activation uniformity: the existing
`uf-workflow` plugin is staged and activated but not
probe-validated, unlike `invoke-agent` and `review-dispatch`.
All four plugins (including the new `uf-finale`) will receive
uniform treatment through the scaffold machinery.

> **Supersession note** (added by `fix-tui-git-output-leak`,
> openspec/changes/fix-tui-git-output-leak/): the TUI-output
> behavior documented in this change — full git output printed
> to TUI via `console.log()`, and `uf_finale_stage` logging the
> staged file list to TUI — is superseded by the
> `plugin-terminal-hygiene` capability. Plugin tool handlers
> MUST NOT write to the process terminal; all output flows
> through JSON result envelopes, and `uf_finale_stage` returns
> the staged file list as `files: string[]`. Archive-time spec
> sync MUST NOT carry the superseded TUI-output requirements
> forward.

## What Changes

1. **Extend `uf-workflow` plugin** with shared tools:
   - `normalize_model_name` — replaces the 6-step inline
     algorithm duplicated in `uf.finale.md` and
     `uf.address-feedback.md` (latter tracked as #709)
   - 9 git operation tools (`git_fetch`, `git_push`,
     `git_push_force_with_lease`, `git_merge`,
     `git_merge_abort`, `git_rebase`, `git_rebase_abort`,
     `git_conflict_files`, `git_commit_no_edit`) — minimal
     JSON to LLM context, full output to TUI (superseded by
     fix-tui-git-output-leak: envelope-only output)

2. **New `uf-finale` plugin** with 8 composite tools:
   - `uf_finale_startup` — branch safety + working tree +
     secret scan + unpushed commits
   - `uf_finale_stage` — git add with file count
   - `uf_finale_commit_context` — diffStat + recent log +
     model normalization
   - `uf_finale_push_state` — fetch + divergence detection
   - `uf_finale_pr_context` — PR check + fork detect +
     template parse + commit log + originating issue +
     unleash-summary artifact (#707)
   - `uf_finale_create_pr` — temp file PR body + gh pr create
   - `uf_finale_ci_poll` — internal polling loop + mergeability
   - `uf_finale_return_to_main` — checkout + pull

3. **Rewrite `uf.finale.md`** from ~1,089 to ~300 lines,
   preserving all LLM decision points (gates, commit message
   generation, PR body authoring, CI failure explanation,
   conflict resolution choices)

4. **Uniform plugin activation** — extend
   `reviewPluginProbeSource()` to import and validate all
   four plugins, not just `invoke-agent` and `review-dispatch`

5. **Scaffold sync** — mirror all plugin and command changes
   to `internal/scaffold/assets/opencode/`, update asset
   counts and test fixtures

## Capabilities

### New Capabilities
- `normalize_model_name`: Shared tool extracting model family
  name from raw model identifier (6-step algorithm)
- `git_fetch`: Fetch a remote branch
- `git_push`: Push with optional --set-upstream
- `git_push_force_with_lease`: Safe force push
- `git_merge`: Merge a ref with conflict detection
- `git_merge_abort`: Abort an in-progress merge
- `git_rebase`: Rebase onto a ref with conflict detection
- `git_rebase_abort`: Abort an in-progress rebase
- `git_conflict_files`: List conflicting files
- `git_commit_no_edit`: Commit without editor (merge commits)
- `uf_finale_startup`: Branch safety gate + working tree scan
- `uf_finale_stage`: Stage all changes with count
- `uf_finale_commit_context`: Gather commit generation context
- `uf_finale_push_state`: Detect push state and divergence
- `uf_finale_pr_context`: Gather PR creation context including
  unleash-summary artifact
- `uf_finale_create_pr`: Create PR via gh CLI
- `uf_finale_ci_poll`: Poll CI checks with internal loop
- `uf_finale_return_to_main`: Return to main branch

### Modified Capabilities
- `uf.finale.md`: Rewritten from ~1,089 to ~300 lines. Same
  workflow, same gates, same outputs — fewer instruction tokens

### Removed Capabilities
- None — all existing behavior is preserved

## Impact

- **Files modified**: ~13 (plugins, command, scaffold Go files,
  tests, opencode.json)
- **Files created**: ~5 (new plugin, new test file, scaffold
  mirrors)
- **Token reduction**: ~70% for `/uf.finale` command
  (~7,900 → ~2,400 tokens)
- **Scaffold asset count**: 67 → 68 total, 63 → 64 deployed
- **Plugin count**: 3 → 4 in opencode.json
- **Test coverage**: New tests for all shared and composite
  tools

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

Plugin tools produce self-describing structured JSON output
with typed fields. The `uf-finale` plugin outputs follow the
existing `success()`/`failure()` envelope pattern established
by `uf-workflow`. Artifacts (unleash-summary, PR metadata) are
consumed through well-known file paths, not runtime coupling.

### II. Composability First

**Assessment**: PASS

The shared git tools in `uf-workflow` are independently usable
by any command (`uf.finale`, `uf.address-feedback`, future
commands). The `uf-finale` plugin is independently installable.
No mandatory cross-plugin dependencies are introduced.

### III. Observable Quality

**Assessment**: PASS

All tool outputs are machine-parseable JSON with structured
error codes. The `uf_finale_ci_poll` tool returns structured
check results with pass/fail status. Full git command output
goes to TUI for human observability while LLM receives only
the structured decision-relevant data. (Superseded by
`fix-tui-git-output-leak`: tool handlers no longer write to
the terminal; observability flows through envelope fields.)

### IV. Testability

**Assessment**: PASS

All plugin tools use dependency injection (GitExec function
signature) for testability, following the pattern established
by `uf-workflow`'s existing `createResolveBaseRefTool`. New
tests in `.opencode/test/` cover both unit and smoke scenarios.
