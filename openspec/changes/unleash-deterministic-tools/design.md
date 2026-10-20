# Design: unleash-deterministic-tools

## Context

`/uf.unleash` is a 1,006-line command. Increment 1
(`unleash-direct-review-dispatch`) moved Steps 4 and 6 to direct
review-dispatch calls and resolved defect 2 (the spec auto-fix
consent gate). The remaining deterministic surface still lives as
prose, per the issue #716 audit:

- Branch Safety Gate (~55 lines): git branch read, pattern match,
  feature-dir derivation, per-tier prerequisite checks.
- Resumability Detection (64 lines): ordered filesystem probes
  plus `get_progress` merge.
- Steps 1-3 (~60 lines): clarification-marker mechanics, plan and
  tasks delegation (read command file, spawn `cobalt-crush-dev`,
  verify artifact).
- Step 5 mechanics: task/phase parsing, checkbox marking,
  conflict-marker scanning after cherry-pick merges.
- Checkpoint ceremony: 10+ "CHECKPOINT: call checkpoint" blockquotes
  (~50 lines).
- Exit/demo templates: eight "## /uf.unleash paused at:" blocks, the
  Step 8 (Demo) block, OUTPUT FIDELITY GUARD and "re-read before
  composing" instructions that exist to fight reconstruction from
  compressed context.
- Defect 1: the unleash-summary artifact
  (`.uf/artifacts/unleash-summary/<slug>.json`) that
  `uf_finale_pr_context` reads is never written.

Constitution Principle VI requires these to be extracted to
executable tools with tests. The shared executor
(`lib/agent-executor.ts`), the uf-workflow plugin's factory pattern
with injected `GitExec`/filesystem dependencies, and the existing
vitest suite provide the structure to build on.

## Goals / Non-Goals

### Goals

- Every deterministic procedure listed above executes in a
  uf-workflow plugin tool covered by `make plugin-test`.
- Fix defect 1: `write_unleash_summary` produces the artifact
  `/uf.finale` already consumes.
- Checkpoints are recorded by the tools that complete steps; the
  ceremony blockquotes disappear.
- Exit and demo output render verbatim from code; the re-read
  guards become structural guarantees.
- Preserve behavior exactly where it is observable: exit message
  text and structure, demo template, degradation paths (Dewey
  absent, Replicator absent), consent gate, review dispatch
  sequences from Increment 1.
- Make resumability strictly more reliable by making artifact-based
  detection authoritative even when checkpoint state was cleared or
  never created.
- DRY the branch classification shared by `uf_finale_startup` and
  the new gate tool via a `lib/` helper.
- Keep both mirrors byte-identical; record measurable line/token
  deltas (Principle VI).

### Non-Goals

- `uf_prepare_review` (optional follow-on absorbing the ~70-line
  bash diff-capture surface in the review steps).
- Modifying `invoke_agent` policy, the review-dispatch plugin, or
  the reviewer manifest — the review-manifest gate there is
  deliberate council policy.
- Moving Step 0 worktree cleanup, comms reservations, or the
  pre-flight skill invocations into plugin code (Replicator MCP
  tools and skills are LLM-callable, not plugin-callable).
- Moving phase iteration, batch-of-4 scheduling, or failure-stop
  orchestration into tools (judgment + MCP interleaving; whole-phase
  mega-tools would also collide with tool timeout bounds).
- Archiving the Increment 1 change; changing `opencode.json`.

## Decisions

### D1: All new tools live in the uf-workflow plugin

`uf-workflow` already provides `/uf.unleash`'s checkpoint, git, and
`resolve_base_ref` tools; the command already requires it. Hosting
the new tools there avoids new plugin registration (`opencode.json`
is untouched) and matches the plugin's charter. Rejected: a new
plugin (new registration surface, no charter benefit); the
invoke-agent plugin (its `invoke_agent` is deliberately gated to
manifested `divisor-*` review agents — a content-agent delegation
tool would blur that policy boundary); review-dispatch (review
domain only).

Tools follow the existing pattern: exported
`createXxxTool(dependencies)` factories with injected `GitExec`,
cwd, and filesystem/script-runner dependencies, returning
`success`/`failure` JSON envelopes. Pure logic (branch
classification, task parsing, template rendering) lives in `lib/`
modules so both the tools and `uf_finale_startup` share it
(Principle IV: testable in isolation).

**Constitution**: Principle II — no new mandatory dependency for
any consumer; Principle IV — injected dependencies, no external
services in tests.

### D2: `uf_delegate_command` — one parameterized delegation tool

Signature (zod-validated): `agent` (default `cobalt-crush-dev`),
`command_path` (optional repo-relative path to the command
markdown, e.g. `.opencode/commands/speckit.plan.md`; omitted for
prompt-only delegation — per-task implement and code-fix calls),
`prompt` (optional extra instructions — task descriptions for
implement delegation), `feature_dir` (optional working-directory
context to append), `expected_artifact` (optional repo-relative
path to verify after the run), `checkpoint_step` (optional step
name — `plan`, `tasks`, or `implement` — recorded through
`writeState` on success), `timeout` (bounded, default 600,000 ms).

Flow: when `command_path` is supplied, read the command file
(bounded, repo-relative, traversal safe) → compose the prompt
(command text when present + feature-dir context + extra
instructions) → resolve the host model and spawn the child
session through `executeAgentSession` (lib/agent-executor.ts —
parenting, abort linkage, timeout, usage/provenance reporting) →
if `expected_artifact` was given, verify it now exists → if
`checkpoint_step` was given, record it through `writeState` with
the artifact data → return `{status, artifact_created,
checkpoint_recorded, childSessionID, usage, error}`. When
verification fails the tool returns a failure envelope carrying
the command's exact STOP message ("Plan generation failed --
plan.md was not created...").

The command path is a parameter because `speckit.plan.md` and
`speckit.tasks.md` are Speckit-scaffolded assets, not uf assets;
hardcoding them would couple uf tooling to another scaffold's file
layout. The tool does NOT consult `.uf/reviewer-capabilities.yaml`
— that manifest gate is review-council policy owned by
`invoke_agent`; this tool's charter is content delegation, which
is why it lives in uf-workflow (D1). Input validation encodes the
boundary structurally: `agent` values matching `divisor-*` are
rejected with a failure envelope directing the caller to
`invoke_agent`.

Rejected alternative: keep Task-tool delegation in command prose.
It works today, but it is exactly the prose-drift surface
Principle VI retires, and artifact verification would remain
LLM-judged.

**Constitution**: Principle VI — the delegation procedure and its
failure semantics become one tested call; Principle III — the
result envelope reports artifact creation, child session, usage,
and errors machine-parseably.

### D3: `uf_unleash_branch_gate` — shared branch classification

A new `lib/` helper `classifyBranch(branch)` returns
`{branchType, changeName, isMain}` — `branchType` is four-valued
(`opsx`/`speckit`/`quick`/`other`), matching `uf_finale_startup`'s
legacy output with the `quick` value added by the
unleash-tier-routing change, with `main`/`master` reported as
`branchType: "other"` and
`isMain: true`; the gate derives its distinct main class from
`isMain`. `uf_finale_startup` is refactored to
consume it (output shape unchanged; existing uf-finale tests must
pass untouched, extended to assert `branchType` for main/master).
The gate tool composes it with:

- `isMain` → failure envelope code `ON_MAIN` carrying the exact
  tier-routing message from the command (unleash-tier-routing
  reroutes this state into tier routing rather than a STOP).
- `opsx/<name>` → tier `openspec`, `feature_dir =
  openspec/changes/<name>/`; verify `tasks.md` exists, else
  failure `NO_TASKS` with the "Run /opsx-propose first" message.
- `NNN-*` → tier `speckit`; derive `feature_dir` from the branch
  name (`specs/<branch>/`, the convention
  `.specify/scripts/bash/common.sh` applies through
  `get_feature_dir`) and check `spec.md` exists in it through the
  injected file-existence dependency; missing spec.md → failure
  `NO_SPEC` with the "Run /speckit.specify first" message. The
  current command's `check-prerequisites.sh --json --require-spec`
  invocation is not ported: the script's CLI supports no
  `--require-spec` flag (unknown options exit 1) and it
  unconditionally requires plan.md — generated at Step 2, after
  the gate runs — so a verbatim port would fail every valid
  Speckit branch. The trade-off — the branch-name convention is
  duplicated from common.sh rather than shared with the script —
  is accepted because the gate must not depend on a script that
  cannot succeed at gate time.
- `quick/<name>` → tier `quick`, no artifact prerequisites
  (added by unleash-tier-routing).
- otherwise → failure `UNRECOGNIZED_BRANCH` with the exact
  tier-routing message from the command.

Success returns the standard uf-workflow success envelope with
payload `{branch, workflow_tier, feature_dir, change_name}`.
Step 0 (worktree cleanup) stays in prose before the
gate call — it calls Replicator MCP tools.

**Constitution**: Principle III — machine-parseable gate verdict
with exact stop-message provenance; Principle IV — git and
file-existence dependencies injected, so tests never touch the
real repository.

### D4: `uf_unleash_detect_resume` — artifact-first resumability

Inputs: `feature_dir`, `workflow_tier`. The tool performs the
command's ordered probes: spec.md `[NEEDS CLARIFICATION]` markers
and `## Clarifications`/plan.md presence (Speckit clarify done
condition), plan.md existence, tasks.md existence, unchecked `- [
]` checkbox count in tasks.md, and — for spec-review and
code-review — the dispatch artifacts under
`.uf/artifacts/dispatch/` that `consolidate_dispatch` persists
(the durable verdict records), read as the authoritative source:
a review step is done only when the most recent dispatch artifact
for its mode (`specs` for spec-review, `code` for code-review)
that belongs to the current branch records an approving verdict
(APPROVE or APPROVE WITH ADVISORIES), under per-mode freshness
rules. The `code` step requires the artifact's recorded head SHA
to equal the current HEAD — the review must cover the exact code
being merged. The `specs` step accepts an artifact whose recorded
head SHA is an ancestor of or equal to the current HEAD, combined
with no uncommitted modifications to the spec artifacts (checkbox
edits in tasks.md excluded): implementation commits advance HEAD
without touching spec artifacts, and strict equality would re-run
a full spec council on every mid-implementation resume — a
regression against today's checkpoint-skip behavior. The store is
flat and repo-global, so foreign-branch artifacts and head SHAs
that have diverged from the current HEAD are ignored.
Checkpoint state — read through the same internal `readState`
path `get_progress` uses — is reconciled against that record, and
checkpoint state claiming review completion without a matching
approving artifact reports the step incomplete (no redundant tool
round-trip in the plugin's own state store). OpenSpec mode forces
checks 1-3 done, as today.

Returns `{step_statuses: {clarify, plan, tasks, spec_review,
implement, code_review}, resume_from, all_complete}`. This keeps
the issue's "not OBE" property: artifact state is authoritative
even on a first `/uf.unleash` run over artifacts created by
`/opsx-propose` or the speckit commands (no checkpoint state yet),
and after `clear_progress` on a completed-but-re-entered pipeline.

**Constitution**: Principle VI — the probe table from
specs/018-unleash-command/research becomes executable instead of
prose; Principle III — one envelope replaces five interleaved
reads.

### D5: Checkpoint auto-recording

Tools that complete pipeline steps record their own checkpoints on
success through the existing `writeState` path: the branch gate
records `branch-safety-gate` (with tier/feature-dir data),
`uf_unleash_detect_resume` records `resumability-detection`,
`uf_delegate_command` records the step named by its
`checkpoint_step` parameter when the run succeeds and the expected
artifact verifies — `plan`/`tasks` from the delegation calls,
`implement` with phase data from per-task calls — and
`format_unleash_demo` records `demo`. Iteration
data for review loops is passed by the command as today, via the
existing `checkpoint` tool (the review steps remain direct
dispatch prose from Increment 1). `clear_progress` at pipeline
completion stays an explicit call in the command. All ceremony
blockquotes are deleted; the command keeps one sentence stating
that tools checkpoint automatically.

**Constitution**: Principle VI — the ceremony is structural;
Principle I — state files remain the shared artifact, unchanged in
shape for `get_progress` readers.

### D6: `format_unleash_exit` and `format_unleash_demo`

`format_unleash_exit({step, reason, tier, findings, questions,
failed_task, error, conflicting_files, failed_command, output})`
renders the exact paused-at template: heading, reason, the
step-specific body block (findings list / questions with context /
failed task and error / conflicting files / failed command and
output), "What to do next" with tier-specific recovery guidance
(Speckit: `/speckit.clarify`; OpenSpec: update
`openspec/changes/<name>/`), and "Then resume".
`format_unleash_demo({tier, what_built, how_to_verify,
test_results})` renders the
Step 8 (Demo) block with the two fixed Next Steps options and
the tier-selected second option.

Both return the rendered markdown in the envelope; the command
emits the tool's output field verbatim. Golden tests assert the
exact templates, replacing the OUTPUT FIDELITY GUARD and the
"re-read before composing" prose. Per Principle VI, one example of
each rendered shape is preserved in the command near the decision
points that consume them.

**As-built (2026-10-17)**: the shipped interfaces differ from the
signatures above. `format_unleash_exit` selects its body block through a
`variant` enum (`UNLEASH_EXIT_VARIANTS`: `clarify`, `spec-review`,
`implement-worker-failed`, `implement-merge-conflict`,
`implement-phase-checkpoint`, `code-review-preflight`,
`code-review-no-success`, `code-review-iterations-exhausted`) rather
than the flat step/reason/findings argument set, and `format_unleash_demo`
takes camelCase `whatWasBuilt`, `howToVerify`, and `testResults` (plus
optional `changeName`), not the snake_case names recorded above.

### D7: `write_unleash_summary` — defect 1

Called at the demo step. Writes
`.uf/artifacts/unleash-summary/<sanitized-branch>.json` (directory
created with restrictive modes; symlink refusal and traversal
protection mirroring the `statePath` pattern) containing the
summary fields the parent composes: change name, tier, feature
dir, review verdicts and iteration counts, learnings stored,
completion timestamp, and the demo-payload fields `whatWasBuilt`,
`howToVerify`, and `testResults` — the exact `unleashSummary`
shape `/uf.finale` reads (the merged finale-token-reduction
contract), composed from the same values the demo step passes to
`format_unleash_demo` (D6). `uf_finale_pr_context` already reads
this path, so no finale change is needed for consumption;
`/uf.finale` gains a non-null unleash summary of the consumed
shape for the first time.

**Constitution**: Principle I — a real inter-hero artifact replaces
a permanently-null field; Principle III — the artifact is
self-describing JSON.

### D8: Clarification mechanics split from judgment

`scan_clarifications({feature_dir})` returns
`[{question, context, line}]` extracted from spec.md
`[NEEDS CLARIFICATION: ...]` markers with surrounding lines.
`resolve_clarification({feature_dir, question, answer, source})`
removes the marker, inserts the answer inline, and appends the
`- Q: ... -> A: ... (Dewey-resolved from ...)` entry to
`## Clarifications`, creating the section if absent. The LLM keeps
query formulation (explicitly not the raw marker text), result
evaluation, and the sufficiency decision; the unanswerable list
and exit remain prose flowing into `format_unleash_exit`.

**Constitution**: Principle VI's judgment boundary — mechanics in
tools, evaluation in prose.

### D9: Implement-step granular tools

`parse_tasks({feature_dir})` returns phases with tasks
`{id, description, parallel, done}` parsed from `## Phase`
headers, `- [ ]` / `- [x]` checkboxes, and `[P]` markers.
`mark_task_complete({feature_dir, task_id})` flips the checkbox
and is idempotent. `scan_conflict_markers({files})` reports which
files contain `<<<<<<<` / `=======` / `>>>>>>>` — necessary because
`git_conflict_files` reads `git diff --diff-filter=U`, which does
not see cherry-pick residue left by `forge_worktree_merge`.
Per-task delegation uses `uf_delegate_command` with the task
description as `prompt`. Phase iteration, batch-of-4 scheduling,
failure-stop, comms reservations, and the pre-flight hard gate
remain prose (MCP interleaving and skill boundaries; whole-phase
tools would risk the 30-minute tool bound while phases run
longer).

**As-built (2026-10-17)**: the shipped parameter names are `tasks_path`
(`parse_tasks`, `mark_task_complete`) and `paths` (`scan_conflict_markers`)
rather than the `feature_dir`/`files` names recorded above.

### D10: Mirrors and verification

Every changed path under `.opencode/` — commands, plugins, lib —
is mirrored byte-identically under
`internal/scaffold/assets/opencode/` (drift tests enforce this;
`.opencode/test/` is not a scaffold asset). New vitest files cover
each tool's success, failure-envelope, validation, and
path-traversal cases plus golden-template tests for the
formatters. Verification: `make plugin-test`, `make test`,
`make lint`. Tasks record before/after line and token deltas for
the rewritten command sections (Principle VI measurable outcome).

### D11: review-matrix per_run_timeout 600s → 1200s

During this change's Step 8 execution (2026-10-15), reviewer runs
on the ~16.5k-line diff timed out at the configured
`per_run_timeout: 600`. The maintainer (Jay Flowers) approved
raising `per_run_timeout` from 600 to 1200 in
`.uf/review-matrix.yaml` (canonical) and
`internal/scaffold/assets/uf/review-matrix.yaml` (mirror) so the
council could review large increments. The approval was given
in-session before the change was applied, and the CHANGELOG
entry carries the note; this decision records the authorization
in the change record after the fact because AGENTS.md requires
review-limit modifications to carry documented maintainer
approval traceable in the change artifacts. Rationale:
single-shot councils on large diffs need more than 600s per run
(observed reviewer runs at ~582KB prompts). Rollback: revert
both files in one commit (no data migration). Scope: the timeout
value only; all other review-matrix gates (severity definitions,
review limits, reviewer sets) are untouched.

**Constitution**: Principle VI — review runs on large changes
must complete rather than fail open; the gatekeeping rule
(documented maintainer authorization for review-limit changes)
is satisfied by this record.

## Risks / Trade-offs

- **Large rewrite of live pipeline text**: mitigated by scenario
  coverage in the spec delta, golden-template tests, drift tests,
  and the Increment 1 precedent; observable output shapes are
  frozen by the formatters.
- **Delegation timeout**: `uf_delegate_command` defaults to 10
  minutes and is bounded at 30; per-task delegation (never
  whole-phase) keeps runs within bounds, and the timeout parameter
  covers long plan/tasks generations.
- **Checkpoint semantics shift**: tools write the same state files
  through the same `writeState` path; `get_progress` readers see
  identical shapes. The change removes LLM discretion, not state
  compatibility.
- **Spec-review freshness approximation**: the ancestor-or-equal
  head-SHA rule plus clean spec artifacts will not auto-reopen the
  spec-review step when spec artifacts are edited in a commit made
  after the approval. The alternative — strict head-SHA equality —
  would re-run the full spec council on every mid-implementation
  resume; the trade is accepted, and the code-review step keeps
  strict equality.
- **Reusing `executeAgentSession` without the manifest gate**:
  deliberate (D2); the boundary is documented — review invocations
  must go through `invoke_agent`, content delegation through this
  tool.
- **`uf_finale_startup` refactor**: the shared `classifyBranch`
  helper must reproduce the existing output shape exactly;
  existing uf-finale tests guard this, extended to assert
  `branchType` for main/master branches.
- **Mirror burden**: four mirrored path groups change together;
  the drift tests make divergence a build failure, not a review
  finding.
- **Cross-change archive ordering (unleash-tier-routing)**: the
  amended artifacts reference `uf_unleash_route_decision` and the
  `quick` branch class delivered by the sibling
  `unleash-tier-routing` change; this change MUST NOT archive
  before that change lands — task 9.4 encodes the archive-gate
  check, mirroring the constraint recorded in the sibling's
  design (both changes carry the ordering note).
