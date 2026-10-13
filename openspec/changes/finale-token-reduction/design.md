## Context

`/uf.finale` is an 1,089-line command template (~7,900 tokens)
where ~75% of the instruction text describes deterministic
procedures: git state checks, branch detection, push-state
resolution, PR metadata gathering, CI polling, and a 6-step
model name normalization algorithm. These procedures consume
LLM context without benefiting from reasoning.

Phase 2 of the Token Reduction epic (#659) established the
`uf-workflow` plugin scaffold with `resolve_base_ref`,
checkpoint tools, and the `success()`/`failure()` envelope
pattern. This design extends that scaffold with shared git
primitives and a new `uf-finale` composite plugin, then
rewrites the command to ~300 lines.

Existing plugins (`invoke-agent`, `review-dispatch`,
`uf-workflow`) establish patterns: `@opencode-ai/plugin`
framework, `tool()` definitions with Zod schemas, injectable
`GitExec` for testability, and shared types in
`.opencode/lib/uf-workflow-types.js`.

## Goals / Non-Goals

### Goals
- Reduce `/uf.finale` from ~1,089 to ~300 lines (~70% token
  reduction)
- Extract all deterministic procedures into plugin tools
- Preserve every LLM decision point (gates, commit message
  generation, PR body authoring, CI failure explanation,
  conflict resolution)
- Share git operation tools across commands (finale,
  address-feedback, future)
- Implement unleash-summary artifact consumption (#707)
- Uniform plugin activation across all four plugins

### Non-Goals
- Migrating `uf.address-feedback.md` to use
  `normalize_model_name` (tracked as #709)
- Changing the functional behavior of `/uf.finale`
- Adding new workflow steps or gates
- Modifying `invoke-agent` or `review-dispatch` plugins

## Decisions

### D1: Two-plugin architecture

Shared git primitives go in `uf-workflow` (reusable by any
command). Finale-specific composite tools go in a new
`uf-finale` plugin.

**Rationale**: Composability First (Principle II). Git
operations are general-purpose; finale orchestration is
command-specific. Other commands (`uf.address-feedback`)
already need `git_push` and `normalize_model_name`.

### D2: Minimal LLM output, full TUI output

Every tool returns minimal structured JSON to the LLM
(decision-relevant data only) while printing full git command
output to TUI via `console.log()` or `console.error()`.

**Example**: `git_push` returns `{success: true}` to LLM but
prints the full `git push` output (remote URLs, branch
tracking, progress) to TUI.

**Rationale**: Observable Quality (Principle III). Humans see
everything; LLM gets only what it needs for decisions.

### D3: Internal CI polling loop

`uf_finale_ci_poll` blocks internally with configurable
timeout (default 15 minutes), polling every 30 seconds. Returns
a single structured result when done rather than requiring the
LLM to implement a polling loop.

**Status values**: `pass`, `fail`, `conflict`,
`no-checks-workflows-exist`, `no-checks-no-workflows`.

**Rationale**: The polling loop is purely deterministic. Moving
it into the tool eliminates ~80 lines of LLM instruction and
the risk of the LLM implementing the loop incorrectly.

### D4: GitExec dependency injection

All git tools accept a `GitExec` function
`(cmd: string, cwd: string) => string` for testability,
following the pattern established by `createResolveBaseRefTool`.

**Rationale**: Testability (Principle IV). Tests inject a mock
executor that returns predetermined output without touching
the filesystem or git.

### D5: Unleash-summary artifact consumption

`uf_finale_pr_context` reads the unleash-summary artifact from
`.uf/artifacts/unleash-summary/<sanitized-branch>.json` per
issue #707. Returns `unleashSummary` with `whatWasBuilt`,
`howToVerify`, `testResults` fields, or `null` if absent.

The LLM uses this to populate PR body sections instead of
analyzing git logs, reducing both tokens and generation time.

**Rationale**: Autonomous Collaboration (Principle I). The
unleash-summary is a well-defined artifact produced by
`/uf.unleash` Step 10 and consumed by `/uf.finale` without
runtime coupling.

**Scope justification**: While #707 is a distinct feature, its
implementation is a single `readFile` + JSON parse within
`uf_finale_pr_context` — a tool already being created in this
change. The alternative (a second change that reopens and
modifies the same tool) would double the review overhead for
~10 lines of integration code. The field is nullable (`null`
when no artifact exists), so it adds zero behavioral change to
existing workflows. Delivering it here avoids a second PR
touching the same file.

### D6: Uniform plugin probe validation

Extend `reviewPluginProbeSource()` to import and validate all
four plugins (invoke-agent, review-dispatch, uf-workflow,
uf-finale), not just the first two. All plugins get uniform
staging, activation, and probe-validation treatment.

**Rationale**: Currently `uf-workflow` is staged and activated
but skipped during probe validation. This inconsistency means
a broken `uf-workflow` plugin would pass activation silently.

**Scope justification**: This change introduces `uf-finale` as
a new plugin that MUST be probe-validated. Updating
`reviewPluginProbeSource()` to add the new plugin is required
work. Fixing the existing `uf-workflow` omission in the same
function at the same time is a 1-line addition that eliminates
a latent inconsistency. Shipping it separately would require
opening `reviewPluginProbeSource()` twice for two adjacent
import additions — the second change adds no independent review
value.

### D7: success/failure envelope reuse

All new tools use the existing `success()` and `failure()`
envelope helpers from `.opencode/lib/uf-workflow-types.js`.
The `failure()` helper includes `retryable`, `code`, and
optional `details` fields for structured error handling.

### D8: Secret candidate detection via filename patterns

`uf_finale_startup` scans staged and unstaged files for
secret-like filenames (`.env`, `*.pem`, `*.key`, `id_rsa`,
etc.) using pattern matching. It does NOT scan file contents —
that would require a dedicated secrets scanner. The tool
returns candidates for the LLM to present as a gate.

### D9: Model normalization algorithm

`normalize_model_name` implements the exact 6-step algorithm
currently duplicated in `uf.finale.md` and
`uf.address-feedback.md`:

1. Strip everything before and including the last `/`
2. Strip everything after and including the first `@`
3. Strip trailing date suffix `-YYYYMMDD`
4. Repeatedly strip trailing `-N` (single digit) segments
5. Validate result matches `[a-zA-Z0-9._-]`
6. Fallback to `unknown-model` on empty or invalid result

## Risks / Trade-offs

### R1: Plugin initialization overhead

Adding a fourth plugin increases OpenCode startup time by one
more plugin initialization. This is negligible (TypeScript
module load, no I/O during init) and consistent with the
existing three-plugin pattern.

### R2: CI poll timeout edge cases

The internal polling loop uses a hardcoded 30-second interval.
If GitHub's checks API is slow, the tool may miss a narrow
window. Mitigated by the configurable timeout parameter and
the fact that CI checks typically take minutes, not seconds.

### R3: Scaffold test maintenance

Adding one asset (uf-finale plugin) requires updating ~8 test
locations across `scaffold_test.go` and
`plugin_activation_test.go`. This is the same maintenance
burden as any scaffold asset addition and is well-understood.

### R4: Breaking change if plugin tools error

If a `uf-finale` tool returns an unexpected error, the LLM
must handle the failure gracefully. All tools use the
`failure()` envelope with structured error codes, and the
rewritten command includes fallback instructions for tool
failures. This matches the existing `resolve_base_ref` pattern.
