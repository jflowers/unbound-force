# unleash Deterministic Tools (Increments 2-5)

Parent: `/uf.unleash` executes its deterministic procedures in
uf-workflow plugin tools with tests; command prose keeps judgment and
orchestration only.

## ADDED Requirements

### Requirement: Branch safety gate tool

`/uf.unleash` Step 1 MUST execute the branch safety gate by calling
`uf_unleash_branch_gate`. The tool MUST classify the current branch
(`main`, `opsx/*`, `NNN-*`, unrecognized), derive the workflow tier
and feature directory, and enforce per-tier prerequisites: for
OpenSpec, `tasks.md` existence under `openspec/changes/<name>/`; for
Speckit, derivation of the feature directory from the branch name
(`NNN-*` -> `specs/<branch>/`, the convention
`.specify/scripts/bash/common.sh` applies) and a direct existence
check for `spec.md` in that directory. The current command's
`check-prerequisites.sh --json --require-spec` invocation is a
defect: the script supports no such flag and unconditionally
requires plan.md, which cannot exist at Step 1 gate time. The
rewrite MUST NOT invoke the script. Every rejection MUST return
a failure envelope carrying the command's exact STOP message. Branch
classification MUST be computed by a shared `lib/` helper that
`uf_finale_startup` also consumes, preserving its existing output
shape: the helper returns a three-valued `branchType` with
`main`/`master` reported as `"other"` plus a separate `isMain`
boolean, and the gate derives its main-branch rejection from
`isMain`. Step 0 worktree cleanup MUST remain in command prose
because it calls Replicator MCP tools.

#### Scenario: OpenSpec branch detected
- **GIVEN** the current branch is `opsx/some-change` and `openspec/changes/some-change/tasks.md` exists
- **WHEN** `uf_unleash_branch_gate` runs
- **THEN** it returns a success envelope (`status: "ok"`) with payload `workflow_tier: "openspec"`, `feature_dir: "openspec/changes/some-change/"`, and `change_name: "some-change"`

#### Scenario: OpenSpec change without tasks
- **GIVEN** the current branch is `opsx/some-change` and no `tasks.md` exists in the change directory
- **WHEN** `uf_unleash_branch_gate` runs
- **THEN** it returns a failure envelope whose message directs the user to run `/opsx-propose` first

#### Scenario: Speckit branch validated
- **GIVEN** the current branch is `018-unleash-command` and `specs/018-unleash-command/spec.md` exists
- **WHEN** `uf_unleash_branch_gate` runs
- **THEN** it returns a success envelope (`status: "ok"`) with payload `workflow_tier: "speckit"` and `feature_dir: "specs/018-unleash-command/"`

#### Scenario: Speckit branch without spec
- **GIVEN** the current branch is `018-unleash-command` and no `spec.md` exists in `specs/018-unleash-command/`
- **WHEN** `uf_unleash_branch_gate` runs
- **THEN** it returns a failure envelope whose message directs the user to run `/speckit.specify` first

#### Scenario: Main and unrecognized branches rejected
- **GIVEN** the current branch is `main` or matches neither `opsx/*` nor `NNN-*`
- **WHEN** `uf_unleash_branch_gate` runs
- **THEN** it returns a failure envelope with the exact STOP message prescribing a Speckit or OpenSpec feature branch

### Requirement: Resumability detection tool

`/uf.unleash` Step 2 MUST determine completed steps by calling
`uf_unleash_detect_resume`, which probes filesystem artifacts
(spec.md clarification markers, `## Clarifications` section or
plan.md presence, plan.md existence, tasks.md existence, unchecked
`- [ ]` task checkboxes), derives spec-review and code-review
completion from the dispatch artifacts `consolidate_dispatch`
persists under `.uf/artifacts/dispatch/` — a flat repo-global
store shared across branches — and reconciles that with checkpoint
state read from the same state store `get_progress` uses. A review
step is done only when the most recent artifact for its mode that
belongs to the current branch records an approving verdict (APPROVE
or APPROVE WITH ADVISORIES), under per-mode freshness rules: the
code-review step requires the artifact's recorded head SHA to equal
the current HEAD; the spec-review step accepts an artifact whose
recorded head SHA is an ancestor of or equal to the current HEAD
when the spec artifacts have no uncommitted modifications (checkbox
edits in tasks.md excluded), because implementation commits advance
HEAD without changing spec artifacts and the spec review MUST NOT
re-run on every mid-implementation resume. Artifacts from other
branches, and artifacts whose recorded head SHA has diverged from
the current HEAD, MUST NOT mark the step done. Checkpoint state
claiming review completion without a matching approving dispatch
artifact MUST NOT report the review step done. The tool MUST return
`{step_statuses, resume_from, all_complete}`. Artifact state MUST be
authoritative even when no checkpoint state exists, so a first
`/uf.unleash` run over artifacts created by `/opsx-propose` or the
Speckit commands skips the completed steps, and compressed-context
summaries are never treated as resumability evidence. OpenSpec mode
MUST report clarify, plan, and tasks as done.

#### Scenario: First run over propose artifacts
- **GIVEN** branch `opsx/some-change` has proposal, design, specs, and tasks artifacts but no `uf.unleash` checkpoint state
- **WHEN** `uf_unleash_detect_resume` runs with tier `openspec`
- **THEN** it reports clarify, plan, and tasks as done and `resume_from` names the spec review step

#### Scenario: All steps complete
- **GIVEN** every task checkbox in tasks.md is `[x]` and the most recent branch-matched dispatch artifacts for both review modes record approving verdicts meeting their per-mode freshness rules
- **WHEN** `uf_unleash_detect_resume` runs
- **THEN** it returns `all_complete: true` so the pipeline resumes at the retrospective step

#### Scenario: Cleared checkpoint state
- **GIVEN** progress state was cleared after a pipeline whose task checkboxes are all `[x]`, but the most recent branch-matched dispatch artifacts for the review steps record non-approving verdicts, or the code-review artifact records a head SHA other than the current HEAD
- **WHEN** `uf_unleash_detect_resume` runs
- **THEN** implementation is reported done from artifact state and the incomplete review steps are re-derived from dispatch artifacts and rerun rather than falsely reported complete

#### Scenario: Foreign-branch or stale artifacts ignored
- **GIVEN** the most recent `specs`-mode artifact records an approving verdict but for a different branch, and the most recent `code`-mode artifact for the current branch records a head SHA other than the current HEAD
- **WHEN** `uf_unleash_detect_resume` runs
- **THEN** both review steps are reported incomplete and the reviews rerun, even though approving artifacts exist in the store

### Requirement: Command delegation tool

`/uf.unleash` MUST perform agent delegation — Steps 2 (plan), 3
(tasks), per-task implement delegation, and Step 6 code-fix
iterations — through `uf_delegate_command`. The tool MUST read the
command file from an optional repo-relative `command_path`
parameter when one is supplied (Speckit-scaffolded command paths
MUST NOT be hardcoded); per-task implement and code-fix delegation
are prompt-only — they pass the raw task or fix description and
MUST omit `command_path`. The tool MUST spawn the
child agent session through the shared `executeAgentSession`
executor with host model resolution, parenting, abort linkage, and
timeout, and verify the `expected_artifact` was created when one is
supplied. On missing artifacts the tool MUST return a failure
envelope carrying the command's exact STOP message. The tool MUST
NOT consult the reviewer manifest — that gate is `invoke_agent`
policy for review invocations; this tool's charter is content
delegation. The tool MUST reject `agent` values matching
`divisor-*` in input validation, directing the caller to
`invoke_agent`, so the delegation/review boundary is structural.

#### Scenario: Plan generated and verified
- **GIVEN** Step 2 delegates with `command_path: ".opencode/commands/speckit.plan.md"` and `expected_artifact` naming the feature directory's plan.md
- **WHEN** the child session completes and plan.md exists
- **THEN** the tool returns success with the child session ID and `artifact_created: true`

#### Scenario: Expected artifact missing
- **GIVEN** a delegated plan generation finishes without creating plan.md
- **WHEN** verification runs
- **THEN** the tool returns a failure envelope whose message is the command's "Plan generation failed" STOP text

#### Scenario: Timeout and abort propagation
- **GIVEN** a delegated run exceeds its timeout or the parent session aborts
- **WHEN** the executor resolves
- **THEN** the tool returns the timeout or cancelled failure result without leaving an unmanaged child session

### Requirement: Checkpoint auto-recording

Tools that complete pipeline steps MUST record their checkpoints on
success through the existing progress state store, preserving the
`ProgressState` shape read by `get_progress`: the branch gate records
`branch-safety-gate`, resumability detection records
`resumability-detection`, `uf_delegate_command` records the step
named by its `checkpoint_step` parameter on success (`plan` and
`tasks` when the expected artifact verifies; `implement` with
phase data for per-task delegation), and the demo formatter
records `demo`. The command MUST
NOT carry per-step checkpoint ceremony blockquotes; it MUST retain
exactly one statement that tools checkpoint automatically, plus the
explicit `clear_progress` call at pipeline completion. Review-loop
iteration checkpoints remain explicit calls in the Increment 1
review step prose.

#### Scenario: Gate checkpoints itself
- **GIVEN** `uf_unleash_branch_gate` returns a success envelope (`status: "ok"`)
- **WHEN** the state store is read for command `uf.unleash`
- **THEN** `branch-safety-gate` appears in `completed_steps` with tier and feature-dir data

#### Scenario: Ceremony removed
- **GIVEN** the rewritten `uf.unleash.md`
- **WHEN** a reader searches for "CHECKPOINT: Call `checkpoint`"
- **THEN** no step-transition ceremony blockquotes remain — the only matches are the auto-checkpoint statement, the completion `clear_progress` call, and the two review-loop iteration checkpoint calls preserved as explicit calls by the Checkpoint auto-recording requirement

### Requirement: Clarification mechanics tools

`/uf.unleash` Step 1 (Speckit) MUST use `scan_clarifications` to
extract `[NEEDS CLARIFICATION]` markers with surrounding context
from spec.md, and `resolve_clarification` to apply a resolution:
remove the marker, insert the answer inline, and append the
`- Q: ... -> A: ... (Dewey-resolved from ...)` entry to
`## Clarifications`, creating the section when absent. The command
prose MUST retain query formulation, result evaluation, and
answer-sufficiency judgment. Silent auto-resolution without human
confirmation MUST be preserved, and unanswerable questions MUST
flow into the rendered exit template.

#### Scenario: Marker scan
- **GIVEN** spec.md contains two `[NEEDS CLARIFICATION: ...]` markers
- **WHEN** `scan_clarifications` runs against the feature directory
- **THEN** it returns each question with its surrounding context lines

#### Scenario: Resolution applied
- **GIVEN** a resolved question with its answer and Dewey source
- **WHEN** `resolve_clarification` runs
- **THEN** the marker is removed from spec.md, the answer is inserted inline, and the `Q: -> A:` entry is appended to `## Clarifications`

#### Scenario: Dewey unavailable
- **GIVEN** Dewey tools are not available in the session
- **WHEN** Step 1 processes markers
- **THEN** all questions are collected as unanswerable and the pipeline exits through the rendered clarify pause template

### Requirement: Task bookkeeping tools

`/uf.unleash` Step 5 MUST use `parse_tasks` to read phases and tasks
from tasks.md (identifier, description, `[P]` parallel marker,
completion state), `mark_task_complete` to flip a task's checkbox
immediately after its delegation succeeds (idempotently), and
`scan_conflict_markers` to detect `<<<<<<<` / `=======` / `>>>>>>>`
residue in files after `forge_worktree_merge` — a check distinct
from `git_conflict_files`, which reads `git diff --diff-filter=U`
and cannot see cherry-pick residue. Phase iteration, batch-of-4
scheduling, failure-stop, comms reservations, and the pre-flight
hard gate MUST remain in command prose.

#### Scenario: Phase parsing with parallel split
- **GIVEN** tasks.md contains a phase with three sequential tasks and two `[P]` tasks
- **WHEN** `parse_tasks` runs
- **THEN** it returns the phase with all five tasks, their identifiers, and the two `[P]` tasks flagged as parallel

#### Scenario: Checkbox marking is idempotent
- **GIVEN** a task whose checkbox is already `[x]`
- **WHEN** `mark_task_complete` runs for that task
- **THEN** tasks.md is unchanged and the tool reports success

#### Scenario: Cherry-pick residue detected
- **GIVEN** a worktree merge leaves conflict markers in a file while `git diff --diff-filter=U` is empty
- **WHEN** `scan_conflict_markers` runs on the affected files
- **THEN** the file is reported as conflicted, driving the cleanup-and-exit path

### Requirement: Tool-rendered exit and demo output

`/uf.unleash` MUST render every "## /uf.unleash paused at:" exit
message through `format_unleash_exit` and the Step 8 (Demo) block
through `format_unleash_demo`, emitting the tools' rendered output
verbatim. The tools MUST reproduce the exact template structure —
heading, reason, step-specific body, tier-specific "What to do next"
recovery guidance, and "Then resume" — for every exit: clarify,
spec review, implement (worker failure, merge conflict, phase
checkpoint), and code review (pre-flight, no-success, iterations
exhausted). The OUTPUT FIDELITY GUARD and "re-read before composing"
instructions MUST be removed from the command, and one rendered
example per consuming decision point SHOULD be preserved near that
decision point.

#### Scenario: Exit rendered verbatim
- **GIVEN** a code review exhausts three fix iterations
- **WHEN** the exit is composed
- **THEN** `format_unleash_exit` returns the paused-at template with persistent findings and the resume guidance, and the command emits it without modification

#### Scenario: Demo template with tier option
- **GIVEN** a completed OpenSpec pipeline
- **WHEN** the demo output is composed
- **THEN** `format_unleash_demo` returns the What Was Built / How to Verify / Test Results / Next Steps block with the OpenSpec refinement option and the fixed `/uf.finale` option

### Requirement: Unleash summary artifact

`/uf.unleash` MUST write the unleash summary artifact at the demo
step by calling `write_unleash_summary`, which persists
`.uf/artifacts/unleash-summary/<sanitized-branch>.json` with
restrictive file modes, symlink refusal, and path-traversal
protection. The artifact MUST contain the change name, workflow
tier, feature directory, review verdicts and iteration counts,
learnings stored, completion timestamp, and the demo payload
fields `whatWasBuilt`, `howToVerify`, and `testResults` — the
`unleashSummary` shape `/uf.finale` reads. This closes defect 1:
`uf_finale_pr_context` already reads this path and MUST receive a
non-null unleash summary for completed pipelines.

#### Scenario: Summary written and consumed
- **GIVEN** the pipeline completes the demo step on branch `opsx/some-change`
- **WHEN** `write_unleash_summary` runs and `/uf.finale` later calls `uf_finale_pr_context`
- **THEN** the summary file exists at `.uf/artifacts/unleash-summary/opsx-some-change.json` and the PR context returns its parsed content as `unleashSummary`, including the `whatWasBuilt`, `howToVerify`, and `testResults` fields

#### Scenario: Branch slug sanitization
- **GIVEN** a branch name containing characters outside the slug alphabet
- **WHEN** `write_unleash_summary` derives the file name
- **THEN** the branch is sanitized through the same slug rules the progress store uses

### Requirement: Judgment boundary

The rewritten `uf.unleash.md` MUST retain as prose exactly the
judgment and interop surfaces: Dewey query formulation and
answer-sufficiency evaluation, phase iteration with batch-of-4 and
failure-stop semantics, the spec auto-fix consent gate via the
question tool, pre-flight skill invocations (hard-gate and
soft-gate modes), Step 0 worktree cleanup and comms reservations
(Replicator MCP calls), and the Increment 1 review dispatch
sequences. The deterministic tools MUST NOT absorb these
responsibilities.

#### Scenario: Consent gate unchanged
- **GIVEN** a spec review REQUEST CHANGES with only LOW/MEDIUM findings
- **WHEN** Step 4 processes the verdict
- **THEN** the question tool presents the three council options before any spec edit, exactly as in Increment 1

#### Scenario: Pre-flight stays skill-driven
- **GIVEN** Step 5 reaches a phase checkpoint
- **WHEN** the hard gate runs
- **THEN** the command loads the `pre-flight` skill and executes its detected commands rather than calling a plugin tool for them

### Requirement: Plugin tool verification

The implementation MUST ship vitest coverage for every new tool in
`make plugin-test`: success paths, failure envelopes, input
validation, path-traversal rejection, and golden-template tests for
the exit and demo renderers. `make test` (drift) and `make lint`
MUST pass with the byte-identical mirrors. The tasks artifact MUST
record before/after line and token deltas for the rewritten command
sections as the Principle VI measurable outcome.

#### Scenario: New tools covered
- **GIVEN** the new uf-workflow tools and lib helpers
- **WHEN** `make plugin-test` runs
- **THEN** every tool's success, failure-envelope, validation, traversal, and golden-template cases pass

#### Scenario: Mirrors remain byte-identical
- **GIVEN** changed files under `.opencode/commands/`, `.opencode/plugins/`, and `.opencode/lib/`
- **WHEN** the scaffold drift tests run
- **THEN** each mirrors its `internal/scaffold/assets/opencode/` counterpart byte-identically

## MODIFIED Requirements

### Requirement: Guardrail consistency

The `/uf.unleash` guardrails MUST name the spec auto-fix consent
gate as the single legitimate mid-pipeline human interaction,
amending the "never pause between steps" rule. The guardrails MUST
retain: never run on `main`, never skip the spec review exit on
HIGH/CRITICAL findings, and actionable exit messages. Prescribed
exit and demo output MUST be rendered by the formatter tools rather
than reconstructed from prose; the OUTPUT FIDELITY GUARD and
re-read instructions MUST NOT remain in the command.

Previously: the guardrails required verbatim demo output preserved
in command prose, enforced by the Step 8 (Demo) OUTPUT FIDELITY GUARD and
"re-read before composing" instructions.

#### Scenario: Guardrails name the gate and the renderers
- **GIVEN** the updated `uf.unleash.md` guardrails section
- **WHEN** a reader searches for the pause prohibition and the demo-output rule
- **THEN** the consent-gate exception is stated explicitly and demo/exit output is prescribed as tool-rendered, with no OUTPUT FIDELITY GUARD present

## REMOVED Requirements

### Requirement: Verification coverage

Reason: superseded by the Plugin tool verification requirement.
Increment 1's markdown-only verification posture (no new code
coverage required) no longer applies: this change adds plugin code,
so coverage is mandatory, and the line/token delta recording is
carried forward by the replacement requirement.
