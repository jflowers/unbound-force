# Proposal: unleash-deterministic-tools

## Why

`/uf.unleash` is a 1,006-line command whose remaining deterministic
procedures still live as prose: the branch safety gate, resumability
detection, plan/tasks delegation mechanics, checkpoint ceremony,
exit and demo templates, task parsing and checkbox marking, and
clarification-marker handling. Issue #716 audits this surface and
names three costs: the LLM re-interprets the procedures on every
run, reconstructs them from memory after context compression (the
SESSION-RESUME GUARD, OUTPUT FIDELITY GUARD, and "re-read before
composing" instructions exist only to fight this), and the
procedures are untestable.

The issue also records defect 1: `uf_finale_pr_context` reads
`.uf/artifacts/unleash-summary/<slug>.json`, but nothing in
`uf.unleash.md` ever writes it, so the unleash-summary context is
permanently null. `write_unleash_summary` implements the
capability requested in open issue #707; the PR body must close
both #716 and #707 (task 8.3).

Increment 1 (`unleash-direct-review-dispatch`, merged as PR #729)
moved the review steps to direct dispatch calls. Constitution
Principle VI (Deterministic Execution) requires the rest to follow:
mechanical procedures MUST execute in tools with tests, prescribed
output MUST be tool-rendered, and re-read guards are interim
mitigations, not the mechanism of record. This change completes
increments 2-5 of the issue: full migration of the remaining
deterministic surface to plugin tools.

## What Changes

- **New tools in the uf-workflow plugin** (the plugin `/uf.unleash`
  already depends on; no new plugin registration):
  - `uf_unleash_branch_gate`: branch classification (main / opsx /
    speckit / unrecognized), workflow tier, feature directory
    derivation, and per-tier prerequisites (opsx tasks.md
    existence; speckit spec.md existence under `specs/<branch>/`,
    derived from the branch name — replacing a
    `check-prerequisites.sh --json --require-spec` invocation that
    cannot succeed at gate time). Returns the gate
    verdict or the exact STOP message (increment 2).
  - `uf_delegate_command`: generic delegation — read a command
    file, spawn a `cobalt-crush-dev` child session through the
    shared `executeAgentSession` executor, and verify the expected
    artifact was created. Serves Steps 2, 3, per-task implement
    delegation, and Step 6 code-fix iterations. The command path is
    a parameter (speckit.plan.md / speckit.tasks.md are
    Speckit-scaffolded, not uf assets). Does not apply the
    review-manifest gate that `invoke_agent` deliberately enforces
    (increment 2).
  - `uf_unleash_detect_resume`: filesystem probes (spec.md
    clarification markers, plan.md/tasks.md existence, unchecked
    task boxes) and dispatch-artifact review derivation
    (approving `.uf/artifacts/dispatch/` verdicts for the current
    branch, per-mode freshness — code review requires the current
    head SHA, spec review accepts an ancestor-or-equal head SHA
    with clean spec artifacts — authoritative over checkpoint
    state) merged with `get_progress`
    checkpoint state into `{step_statuses, resume_from,
    all_complete}` (increment 3).
  - `scan_clarifications` / `resolve_clarification`: extract
    `[NEEDS CLARIFICATION]` markers with surrounding context, and
    apply a resolution (remove marker, insert answer, append the
    `Q: -> A:` entry to `## Clarifications`) (increment 4).
  - `parse_tasks` / `mark_task_complete` / `scan_conflict_markers`:
    phase and `[P]` task parsing, checkbox edits, and
    cherry-pick-residue conflict scanning that `git_conflict_files`
    cannot see (increment 5).
  - `format_unleash_exit` / `format_unleash_demo`: render the
    "## /uf.unleash paused at:" exit templates and the Step 8 (Demo)
    template verbatim from code (increment 4).
  - `write_unleash_summary`: write
    `.uf/artifacts/unleash-summary/<slug>.json` for
    `uf_finale_pr_context` consumption — fixes defect 1
    (increment 4).
- **Shared branch classification**: the branch classification now
  duplicated between `uf_finale_startup` (uf-finale/index.ts:63-78)
  and the new gate tool is extracted to a shared `lib/` helper used
  by both (DRY; touches the uf-finale plugin).
- **Checkpoint auto-recording**: tools that complete pipeline steps
  record their own checkpoints; the 10+ "CHECKPOINT: call
  checkpoint" ceremony blockquotes (~50 lines) are removed
  (increment 3).
- **`uf.unleash.md` rewritten** to call the tools. Judgment stays
  in prose: Dewey query formulation, answer-sufficiency evaluation,
  phase iteration / batch-of-4 / failure-stop orchestration, the
  spec auto-fix consent gate, and pre-flight skill invocation.
  Step 0 worktree cleanup stays in prose (`forge_worktree_*` are
  Replicator MCP tools, callable by the LLM but not from plugin
  code), as do comms reservations and the Increment 1 review
  dispatch sequences.
- **Mirrors**: every changed path under `.opencode/` (commands,
  plugins, lib) is updated byte-identically in
  `internal/scaffold/assets/opencode/`, enforced by drift tests.

## Capabilities

### New

- None as a separate capability; the tools extend the `unleash`
  capability's implementation surface.

### Modified

- `unleash`: deterministic procedures (branch gate, resume
  detection, delegation, task bookkeeping, clarification
  mechanics, checkpointing, exit/demo rendering, summary
  artifact) execute in uf-workflow plugin tools with tests;
  command prose shrinks to judgment and orchestration.

### Removed

- CHECKPOINT ceremony blockquotes, the Step 8 (Demo) OUTPUT
  FIDELITY GUARD, and the SESSION-RESUME GUARD's re-read
  instructions —
  replaced by the structural guarantees the tools provide.

## Impact

- **Files**: `.opencode/commands/uf.unleash.md` + mirror;
  `.opencode/plugins/uf-workflow/index.ts` + mirror;
  `.opencode/plugins/uf-finale/index.ts` + mirror (shared helper
  consumption); `.opencode/lib/` + mirror (shared branch
  classification and task-parsing helpers); `.opencode/test/`
  (new tool tests; not a scaffold asset). `opencode.json` is
  unchanged — uf-workflow is already registered.
  Also `.uf/review-matrix.yaml` + scaffold mirror
  (`internal/scaffold/assets/uf/review-matrix.yaml`):
  maintainer-approved (Jay Flowers, 2026-10-15, design decision
  D11) `per_run_timeout` 600 → 1200 so reviewer runs complete
  on large diffs.
- **Behavior**: exit and demo template output is preserved
  verbatim (rendered by tools rather than prose). Resumability
  becomes strictly more reliable: artifact-based detection runs
  even when checkpoint state was cleared, never created, or
  stale — the dispatch-artifact record is authoritative for
  review-step completion.
- **Out of scope**: `uf_prepare_review` (optional follow-on
  absorbing the bash diff-capture surface, ~70 lines); changes to
  the review-dispatch plugin or `invoke_agent` policy; Step 0 and
  comms-reservation mechanics.
- **Sequencing**: the MODIFIED (Guardrail consistency) and
  REMOVED (Verification coverage) spec deltas resolve against the
  unarchived Increment 1 change
  (`openspec/changes/unleash-direct-review-dispatch/`); this
  change MUST be validated and archived after Increment 1
  archives — task 9.2 encodes the deferred validation and anchor
  re-verification. The `write_unleash_summary` tool also
  supersedes the second unarchived sibling
  (`openspec/changes/persist-unleash-summary/`): after the merge,
  `write_unleash_summary` is the mechanism of record and
  `persist_unleash_summary` survives only as a compatibility
  registration aliasing it. That sibling's `unleash-summary`
  delta still carries its original requirement text — FR-004
  pins "All three tool parameters MUST be non-empty" against a
  tool that now takes eight parameters, and FR-006 names
  `persist_unleash_summary` in command prose the rewritten
  command no longer contains. The two changes modify different
  capabilities, so strict validation cannot flag the
  contradiction at archive time; task 9.3 defers the
  reconciliation (annotating the sibling's stale requirement
  lines with superseded-by references before it archives),
  mirroring the task 9.2 pattern.
- **Metrics**: before/after line and token deltas for the rewritten
  command sections are recorded during implementation per
  Principle VI (target: majority of procedural section text
  replaced by tool calls).
- **Docs**: CHANGELOG entry. Two user-visible deltas exist —
  `/uf.finale` receives a non-null unleash summary (with
  `whatWasBuilt`/`howToVerify`/`testResults`) for the first time,
  and `/uf.unleash` resumability becomes artifact-first — so the
  documentation-issue gate MUST be assessed rather than presumed
  exempt. Two issue targets apply and task 8.2 resolves each
  explicitly, with duplicate-avoidance (search open issues
  first, then reference or consolidate) attached to BOTH: a
  `docs`-labeled issue against this repo (AGENTS.md
  documentation gate; overlapping open issues #728 — Increment
  1's twin for this command — plus adjacent #710 and #706) and
  an issue in `unbound-force/website` (org constitution
  Cross-Repo Documentation rule: user-facing workflow change,
  filed before the implementing PR merges, referencing the
  existing open unleash-related website issues #234, #262,
  #300, #302, and Increment 1's #307); task 8.2 records both
  filed issue numbers or the per-target exemption rationale.
  Blog coverage: assessed and exempt for this change (internal
  workflow refactor; maintainer decision 2026-10-15).

## Constitution Alignment

- **I. Autonomous Collaboration — PASS**: every tool returns a
  self-describing JSON envelope (`success`/`failure` with error
  codes), and the unleash-summary artifact finally written by
  `write_unleash_summary` gives `/uf.finale` a real artifact to
  consume instead of a permanently-null field. No new runtime
  coupling; Replicator MCP interoperability is preserved by
  keeping worktree/comms calls in prose rather than folding them
  into plugin code.

- **II. Composability First — PASS**: all tools live in the
  uf-workflow plugin the command already requires; no new plugin,
  dependency, or mandatory peer. Degradation behavior is
  preserved: Dewey-absent runs still collect unanswerable
  questions and exit; Replicator-absent runs still fall back to
  sequential `[P]` execution.

- **III. Observable Quality — PASS**: branch gate, resume
  detection, delegation, and rendering all produce
  machine-parseable output with structured fields; failures carry
  codes and retryability. The exit/demo templates render
  identically on every run because they are code, not
  reconstructed prose.

- **IV. Testability — PASS**: tools are created by exported
  factories with injected `GitExec`/filesystem dependencies
  (matching the existing uf-workflow pattern) and ship with vitest
  coverage wired into `make plugin-test`; drift tests (`make
  test`) enforce the byte-identical mirrors.

- **V. Security by Default — PASS**: no new dependencies. Tool
  inputs are validated (bounded strings, path parameters resolved
  against the project root with traversal protection, matching the
  `statePath` pattern); artifact writes use restrictive file
  modes; delegation prompts are read from repo files, not
  interpolated into shells.

- **VI. Deterministic Execution — PASS**: this change is Principle
  VI applied end-to-end — mechanical procedures extracted to
  executable tools with tests, prescribed terminal output rendered
  by tools, one or two output-format examples preserved near the
  decision points that consume them, and measurable line/token
  deltas recorded in the tasks artifact.
