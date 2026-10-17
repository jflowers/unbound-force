---
description: >
  Run the full Speckit or OpenSpec pipeline autonomously:
  clarify ambiguities with Dewey, generate plan and tasks,
  review specs, implement with parallel Swarm workers,
  review code, store learnings, and present demo
  instructions. Exits to the human only when it genuinely
  needs human judgment.
---
<!-- scaffolded by uf vdev -->

# Command: /uf.unleash

## Description

Autonomous pipeline execution for both Speckit (strategic)
and OpenSpec (tactical) changes. Takes a spec from draft
to demo-ready code in a single command. Orchestrates 8
steps: clarify, plan, tasks, spec review, implement, code
review, retrospective, and demo. Exits gracefully when
human judgment is needed and resumes from where it left
off on re-run.

## Usage

```
/uf.unleash
```

## Instructions

<protect>

> **SESSION-RESUME GUARD**: If you are resuming this
> command after context compression or a session restart,
> STOP and re-read this entire template before continuing.
> Do NOT infer which steps are complete from compressed
> context summaries. Only the `uf_unleash_detect_resume`
> result (checkpoint state plus dispatch artifacts, with
> artifact evidence authoritative) determines resumability.

Step tools checkpoint automatically as they complete; the
review-loop iteration checkpoints and the completion
`clear_progress` call remain explicit.

### TodoWrite Progress Tracking

Use the **TodoWrite tool** for live session visibility.
At pipeline start, initialize TodoWrite with all 11 steps
(Steps 0-10) as `pending`. Before starting each step,
mark it `in_progress`. After completing each step, mark
it `completed`. This runs alongside the `checkpoint`
tool progress tracking — both MUST be maintained.

On resume from compressed context, call `get_progress`
with `command: "uf.unleash"` and re-initialize the
TodoWrite list from the returned state:
`completed_steps` entries become `completed`, the
`current_step` becomes `in_progress`, and remaining
steps become `pending`.

### 0. Startup Cleanup

Before any pipeline logic, clean up stale worktrees from
previous interrupted runs:

1. Call `forge_worktree_list` with the project path.
2. If any worktrees exist, call `forge_worktree_cleanup`
   with `cleanup_all: true` to remove them.
3. This cleanup does NOT affect resumability -- spec.md,
   plan.md, tasks.md, and task checkboxes live in the main
   working directory, not in worktrees.

If `forge_worktree_list` is not available (Replicator
not installed), skip this step silently.

Proceed immediately to Step 1. Do NOT ask for confirmation.

### 1. Branch Safety Gate

Call the `uf_unleash_branch_gate` tool (no parameters). It
reads the current branch, classifies it as OpenSpec
(`opsx/*`) or Speckit (`NNN-*`), enforces the per-tier
prerequisite (`openspec/changes/<name>/tasks.md` or
`specs/<branch>/spec.md`), and auto-checkpoints
`branch-safety-gate` on success.

- **On success** (`status: "ok"`): set `WORKFLOW_TIER` and
  `FEATURE_DIR` from the payload's `workflow_tier` and
  `feature_dir` fields, then announce the detected mode:
  - `workflow_tier = openspec`: Announce: "Detected
    OpenSpec change: `<change_name>`"
  - `workflow_tier = speckit`: Announce: "Detected Speckit
    change: `<change_name>`"

- **On failure**: the envelope (ON_MAIN, NO_TASKS, NO_SPEC,
  or UNRECOGNIZED_BRANCH) carries the exact STOP message.
  Emit the message and **STOP**.

Proceed immediately to Step 2. Do NOT ask for confirmation.

### 2. Resumability Detection

Call the `uf_unleash_detect_resume` tool with
`{feature_dir: FEATURE_DIR, workflow_tier: WORKFLOW_TIER}`.
The tool probes the feature-dir artifacts (spec.md
clarification markers, plan.md and tasks.md existence,
unchecked `- [ ]` task checkboxes) and derives
spec-review and code-review completion from the dispatch
artifacts under `.uf/artifacts/dispatch/`, reconciled
with checkpoint state -- artifact evidence is
authoritative, so a checkpoint claim without a matching
approving dispatch artifact reports the review step
incomplete. The tool auto-checkpoints
`resumability-detection` on success. **Important**:
compressed context summaries are NOT valid resumability
indicators -- the tool's probing is the authority, even
when checkpoint state is missing, cleared, or stale.

The tool returns `{step_statuses, resume_from,
all_complete, unchecked_count, checkpoint_claims}`:
`step_statuses` maps `clarify`, `plan`, `tasks`,
`spec_review`, `implement`, and `code_review` to done
booleans (OpenSpec forces clarify, plan, and tasks done;
implement is done when zero `- [ ]` boxes remain);
`resume_from` names the first incomplete step in
pipeline order (null when `all_complete` is true);
`unchecked_count` carries implement progress; and
`checkpoint_claims` reports what the state store claimed
for the review steps. On failure, emit the envelope's
error and **STOP** (fail-closed -- never guess step
state).

Display the detection results, deriving each mark from
`step_statuses` (✓ done, ✗ not done). For OpenSpec mode:

```
Detected: OpenSpec mode — artifacts from /opsx-propose
  clarify ✓ (skipped)  plan ✓ (skipped)  tasks ✓ (skipped)
  spec-review [status]  implement [status]  code-review [status]
```

For Speckit mode:

```
Detected: clarify ✓ plan ✓ tasks ✓ spec-review ✗
Resuming at step 4/8: Reviewing specs...
```

Render each `[status]` as ✓ or ✗; when implement is
incomplete, show its progress from `unchecked_count`
(e.g., `implement ✗ (3 unchecked)`).

Skip all steps whose `step_statuses` entries are true.
Resume from `resume_from` (the first incomplete step);
the `Resuming at step N/8` line names that step.

If `all_complete: true` (every step done): skip directly
to step 7 (retrospective) since it is idempotent.

Proceed immediately to Step 3. Do NOT ask for confirmation.

### 3. Step 1 -- Clarify

**If `WORKFLOW_TIER = openspec`**: skip this step.
Announce: "OpenSpec mode — clarify handled by
/opsx-propose."

Call `scan_clarifications` with:

```
scan_clarifications
  feature_dir: FEATURE_DIR
```

The tool scans spec.md in the feature directory for
`[NEEDS CLARIFICATION]` markers and returns
`{questions: [{question, context, line}], count}`. On
failure, emit the envelope's error and **STOP**
(fail-closed).

**If `count` is 0**: announce "No clarification needed"
and proceed to step 2.

**If questions exist**: for each question:

1. Formulate a targeted Dewey semantic search query by
   combining the question's topic keywords with the
   project domain (from the spec title and description).
   Do NOT use the raw `[NEEDS CLARIFICATION]` text
   verbatim as the query.

2. **If Dewey is available** (`dewey_semantic_search`
   tool exists): call `dewey_semantic_search` with the
   formulated query and evaluate the results using your
   judgment:
   - If the results sufficiently answer the question,
     call `resolve_clarification` with:

     ```
     resolve_clarification
       feature_dir: FEATURE_DIR
       question: [the question exactly as scanned]
       answer: [the answer composed from the results]
       source: [Dewey page name or block UUID]
     ```

     This is a silent auto-resolution -- do NOT ask
     the human for confirmation. On failure, emit the
     envelope's error and **STOP**.
   - If the results are empty, off-topic, or do not
     sufficiently answer the question: add the question
     to the unanswerable list.

3. **If Dewey is NOT available**: add ALL questions to
   the unanswerable list. Note:
   > "Dewey not available -- all clarification questions
   > require human input."

**After processing all questions**:

- If the unanswerable list is empty: all questions were
  auto-resolved. Announce how many were resolved and
  proceed to step 2.
- If the unanswerable list is NOT empty: **EXIT** by
  calling `format_unleash_exit` with variant `clarify`
  and the unanswerable questions, each passed as
  `{question, context}` exactly as scanned:

  ```
  format_unleash_exit
    variant: "clarify"
    questions: [{question, context}, ...]
  ```

  Emit the returned `{text}` verbatim. Rendered shape:

  ```
  ## /uf.unleash paused at: clarify

  **Reason**: N question(s) require human input

  Q1: [question text]
  Context: [surrounding spec lines]

  ### What to do next
  Answer these questions in the spec, then re-run
  `/uf.unleash`.

  ### Then resume
  Run `/uf.unleash` to continue from the plan step.
  ```

Proceed immediately to Step 4. Do NOT ask for confirmation.

### 4. Step 2 -- Plan

**If `WORKFLOW_TIER = openspec`**: skip this step.
Announce: "OpenSpec mode — plan handled by
/opsx-propose."

Generate the implementation plan by delegating to the
`cobalt-crush-dev` agent via `uf_delegate_command`:

```
uf_delegate_command
  command_path: ".opencode/commands/speckit.plan.md"
  feature_dir: FEATURE_DIR
  expected_artifact: FEATURE_DIR + "plan.md"
  checkpoint_step: "plan"
```

The tool verifies `plan.md` and auto-checkpoints `plan` on
success. On failure the envelope carries the exact STOP
message -- emit it and **STOP**.

Proceed immediately to Step 5. Do NOT ask for confirmation.

### 5. Step 3 -- Tasks

**If `WORKFLOW_TIER = openspec`**: skip this step.
Announce: "OpenSpec mode — tasks handled by
/opsx-propose."

Generate the task list by delegating to the
`cobalt-crush-dev` agent via `uf_delegate_command`:

```
uf_delegate_command
  command_path: ".opencode/commands/speckit.tasks.md"
  feature_dir: FEATURE_DIR
  expected_artifact: FEATURE_DIR + "tasks.md"
  checkpoint_step: "tasks"
```

The tool verifies `tasks.md` and auto-checkpoints `tasks`
on success. On failure the envelope carries the exact STOP
message -- emit it and **STOP**.

Proceed immediately to Step 6. Do NOT ask for confirmation.

### 6. Step 4 -- Spec Review

Review the spec artifacts using the review council in
spec review mode. This step subsumes `/speckit.analyze`
and `/speckit.checklist` -- the review council's 5
Divisor agents provide equivalent coverage (consistency
analysis + quality validation) in a single pass.

**Normative protocol reference**: the "Resolve Immutable
Input Context", "Shared Dispatch, Evidence, and
Finalization Protocol", and "Spec Review Mode" sections
of `.opencode/commands/uf.review-council.md` govern the
dispatch sequence below. This command cites those
sections instead of embedding their text.

1. Announce: "Spec review starting -- dispatching the
   review council directly via the review-dispatch
   plugin (no child driver session)."
2. Call `resolve_base_ref` (no network access) and
   announce the resolved base ref and its SHA. SHA and
   ref validation failures MUST stop the step
   (fail-closed, no fallback).
3. Capture the immutable input context:
   - Resolve the head SHA via `git rev-parse HEAD`.
   - Capture tracked changes via
     `git diff <base_sha> -- .` and untracked files
     via `git ls-files --others --exclude-standard`
     (treated as full-content additions in the diff).
   - Save the combined diff to a file.
   - Derive the raw `changed_files` list with per-file
     insertion/deletion counts.
   - If HEAD equals the base SHA and the working tree
     carries the change (no commits ahead), the input
     context is the uncommitted local path:
     `uncommitted: true` with `pr_number: null`.
4. Discover reviewer agents: enumerate the regular
   `divisor-*.md` files in `.opencode/agents/`, strip
   the `.md` extension, and sort the list. Zero
   discovered reviewers MUST stop the step
   (fail-closed).
5. Load the `dispatch-advisor` skill (invoke the
   `skill` tool with name `dispatch-advisor`), then
   call `plan_review_dispatch` with mode `specs`,
   `full: false`, `augment: false`, and the
   `changed_files` list. Display the plan JSON exactly
   as returned. Proceed only when the plan status is
   `ready`, `workflow_result` is null, and `errors` is
   empty; otherwise finalize the failed dispatch and
   exit.
6. Call `dispatch_review_runs` exactly once with mode
   `specs`, command `review-council`, `diff_path` (the
   saved diff file), `changed_files`, `input_context`,
   `plan_entries`, `session_metadata` (command, mode,
   full, input context, change profile, plan,
   coverage), and the plan limits (`max_parallel_runs`,
   `budget_usd`, `per_run_timeout_ms`). Pass the spec
   artifacts as `review_context`. Then call
   `consolidate_dispatch` exactly once per finalization
   attempt with provenance: branch, 40-character head
   SHA, and `workflow_id: "uf.review-council"`.

**Processing results**:

- If the verdict is APPROVE or APPROVE WITH ADVISORIES:
  record any advisories for the final report and
  proceed to step 5 (approving verdicts never trigger
  the consent gate below).

- If the verdict is REQUEST CHANGES with only LOW and
  MEDIUM findings (any HIGH/CRITICAL finding bypasses
  this gate): present the spec auto-fix consent gate.
  Spec artifacts MUST NOT be modified on LOW/MEDIUM
  findings without explicit human consent. The
  council's session-resume guard applies to this
  gate: consent captured before a context compression
  or session resume is not valid, and the question
  MUST be re-presented on resume. Use the **question
  tool** with the council's three options, exactly as
  labeled below:
  - **"Apply auto-fixes"** (consent): the parent
    command itself applies the LOW/MEDIUM fixes per
    `.opencode/uf/packs/severity.md` -- formatting,
    status fields, terminology, cross-references,
    obvious gaps, stale metadata. HIGH/CRITICAL
    findings are report-only and MUST NOT be
    auto-fixed.
  - **"Review findings first"**: display the findings,
    then the question tool re-presents the same three
    options. No spec edits occur until a selection is
    made.
  - **"Skip auto-fixes -- report only"** (decline):
    exit using the same exit path as the HIGH/CRITICAL
    branch below (the tool-rendered `spec-review`
    exit), making no spec edits.

  After consented fixes, re-run the review: re-resolve
  the immutable input, re-validate the full plan, and
  rerun every included reviewer (not just failing or
  content-affected ones), reusing a single
  sibling-evidence acquisition across the iteration.
  Keep the iteration counter. Each re-run verdict is
  processed through these same rules -- the gate
  re-presents on REQUEST CHANGES with only LOW/MEDIUM
  findings. Cap at 3 iterations: if REQUEST CHANGES
  persists to a fourth encounter, exit through the
  same tool-rendered `spec-review` exit path.

  > CHECKPOINT: Call `checkpoint` with `command:
  > "uf.unleash"`, `step: "spec-review"`, and
  > `data: '{"iteration": N}'`.

- If HIGH or CRITICAL findings remain after auto-fixing
  LOW/MEDIUM: **EXIT** by calling `format_unleash_exit`
  with:

  ```
  format_unleash_exit
    variant: "spec-review"
    tier: WORKFLOW_TIER
    findings: [HIGH/CRITICAL findings with context]
    change_name: [change name]
  ```

  The tool selects the tier-specific recovery guidance
  from `tier`. Emit the returned `{text}` verbatim.
  Rendered shape:

  ```
  ## /uf.unleash paused at: spec review

  **Reason**: HIGH/CRITICAL findings in spec artifacts

  ### Findings

  [list each HIGH/CRITICAL finding with context]

  ### What to do next
  [tier-specific recovery guidance]

  ### Then resume
  Run `/uf.unleash` to continue from spec review.
  ```

Proceed immediately to Step 7. Do NOT ask for confirmation.

### 7. Step 5 -- Implement

Read the phases and tasks by calling `parse_tasks` with:

```
parse_tasks
  tasks_path: FEATURE_DIR + "tasks.md"
```

The tool returns `{phases: [{phase, tasks: [{id,
description, parallel, done}]}], total_tasks, done_count,
all_done}`. Every `##` heading starts a phase (the
returned `phase` is its heading text); each top-level
checkbox task carries its `id` (e.g. `5.1`, `T001`), its
`description` with the `[P]` marker stripped, its
`parallel` flag, and its `done` state. Number the phases
1-based in document order -- that number is the `phase`
value passed to per-task delegation and the implement
exit variants. On failure, emit the envelope's error and
**STOP** (fail-closed).

**Derive build/test commands**: Load the `pre-flight`
skill (invoke the `skill` tool with name `pre-flight`)
and use its CI Workflow Parsing phase to discover the
exact CI commands from `.github/workflows/`. Also run
its Local Tool Detection phase to discover additional
tools from config files. This is the shared pre-flight
logic used by `/uf.review-council` and `/uf.review-pr`.

**For each phase in tasks.md**:

1. Separate the phase's tasks into two groups from the
   parse result:
   - **Sequential** (`parallel: false`): run first, in
     order
   - **Parallel** (`parallel: true`, `[P]` marker): run
     after sequential tasks complete

   Skip tasks already `done: true` -- resume re-runs only
   incomplete work.

2. **Sequential execution**: for each remaining non-`[P]`
   task, delegate to the `cobalt-crush-dev` agent via
   `uf_delegate_command`, passing the task description
   as the prompt (prompt-only -- no `command_path` for
   per-task implement calls):

   ```
   uf_delegate_command
     prompt: [the task description exactly as parsed]
     feature_dir: FEATURE_DIR
     checkpoint_step: "implement"
     phase: [phase number]
   ```

   The tool auto-checkpoints `implement` with the phase
   data on success. On failure, emit the envelope's error
   and **STOP**.

   After each successful delegation, mark the task
   complete immediately -- the checkbox is the
   authoritative progress record, and `already_complete:
   true` on resume is a no-op success:

   ```
   mark_task_complete
     tasks_path: FEATURE_DIR + "tasks.md"
     task_id: [the task's id from the parse result]
   ```

   On failure, emit the envelope's error and **STOP**.

3. **Parallel execution**: check if
   `forge_worktree_create` is available.

   **If Swarm worktrees are available**:

   a. Get the current commit hash:
      ```bash
      git rev-parse HEAD
      ```

   b. Limit concurrent workers to 4. If more than 4
      `[P]` tasks exist in the phase, batch them: run
      the first 4, wait for all to complete, then run
      the next batch.

   c. For each `[P]` task in the current batch:
      - Call `forge_worktree_create` with the project
        path, task ID, and current commit hash to create
        a dedicated worktree.
      - Call `forge_spawn_subtask` with the task
        description, files from the task, and the
        worktree path.

   d. Wait for all workers in the batch to complete.

   e. **If any worker fails**: stop spawning new workers
      (do not start the next batch). Wait for any
      already-running workers to complete or fail. Then
      call `forge_worktree_cleanup` with `cleanup_all:
      true` to remove all worktrees. **EXIT** by calling
      `format_unleash_exit` with:

      ```
      format_unleash_exit
        variant: "implement-worker-failed"
        phase: [phase number]
        failed_task: [task ID and description]
        error: [error details from worker]
      ```

      Emit the returned `{text}` verbatim. Rendered
      shape:

      ```
      ## /uf.unleash paused at: implement (Phase N)

      **Reason**: Parallel worker failed

      **Failed task**: [task ID and description]
      **Error**: [error details from worker]

      ### What to do next
      Fix the issue described above, then re-run
      `/uf.unleash`.

      ### Then resume
      Run `/uf.unleash` to continue from the failed phase.
      ```

   f. After all workers in a batch complete successfully,
      merge each worktree back:
      - Call `forge_worktree_merge` for each worktree.
        This uses cherry-pick to apply the worker's
        commits to the main branch.
      - After each merge, scan the affected files for
        conflict-marker residue -- cherry-pick leftovers
        that `git diff --diff-filter=U` cannot see once
        the merge completes:

        ```
        scan_conflict_markers
          paths: [files affected by the merge]
        ```

        The tool returns `{conflicts: [{path, markers:
        [{line, marker}]}], clean, warnings}`. On failure,
        emit the envelope's error and **STOP**.
      - If `clean: true`: merge succeeded. Call
        `forge_worktree_cleanup` for that worktree.
      - If `conflicts` is non-empty: auto-resolution
        failed. Call `forge_worktree_cleanup` with
        `cleanup_all: true`. **EXIT** by calling
        `format_unleash_exit` with:

        ```
        format_unleash_exit
          variant: "implement-merge-conflict"
          phase: [phase number]
          conflicting_files: [paths from the scan result]
        ```

        Emit the returned `{text}` verbatim. Rendered
        shape:

        ```
        ## /uf.unleash paused at: implement (Phase N)

        **Reason**: Worktree merge conflict

        **Conflicting files**:
        [list files with conflict markers]

        ### What to do next
        Resolve the merge conflicts manually, then
        re-run `/uf.unleash`.

        ### Then resume
        Run `/uf.unleash` to continue from the current
        phase.
        ```

   g. Mark each successfully merged `[P]` task complete
      immediately by calling `mark_task_complete` with
      the same `tasks_path` and the task's `task_id`.

   **If Swarm worktrees are NOT available**: fall back to
   sequential execution for `[P]` tasks. Announce:
   > "Swarm worktrees not available -- executing parallel
   > tasks sequentially. Install Replicator for
   > parallel execution."

   Execute each `[P]` task sequentially through the same
   `uf_delegate_command` and `mark_task_complete`
   sequence as non-`[P]` tasks.

   **Comms file reservations**: if `comms_reserve`
   is available, reserve file paths for each parallel
   worker before spawning. If Comms is NOT available,
   proceed without file locks -- worktree isolation
   provides sufficient protection for parallel workers.

4. **Phase checkpoint**: after all tasks in the phase
   are complete (both sequential and parallel), run the
   pre-flight skill in `hard-gate` mode to execute all
   detected CI and local tool commands.

   - If all pass: proceed to the next phase.
   - If any fail: **EXIT** by calling
     `format_unleash_exit` with:

     ```
     format_unleash_exit
       variant: "implement-phase-checkpoint"
       phase: [phase number]
       failed_command: [the command that failed]
       output: [error output]
     ```

     Emit the returned `{text}` verbatim. Rendered
     shape:

     ```
     ## /uf.unleash paused at: implement (Phase N checkpoint)

     **Reason**: Build or test failure after Phase N

     **Failed command**: [the command that failed]
     **Output**: [error output]

     ### What to do next
     Fix the build/test failure, then re-run `/uf.unleash`.

     ### Then resume
     Run `/uf.unleash` to continue from the next phase.
     ```

Proceed immediately to Step 8. Do NOT ask for confirmation.

### 8. Step 6 -- Code Review

Review the implementation using the review council in
code review mode, dispatched directly via the
review-dispatch plugin (no child driver session). This
includes the Phase 1a pre-flight soft gate (all checks
executed, failures classified by causality, only
branch-caused failures block), Phase 1b Gaze quality
analysis (conditional, informational), and Divisor agent
reviews.

**Normative protocol reference**: the "Resolve Immutable
Input Context", "Shared Dispatch, Evidence, and
Finalization Protocol", and "Code Review Mode" sections
of `.opencode/commands/uf.review-council.md` govern the
pre-flight gate and dispatch sequence below. This
command cites those sections instead of embedding their
text.

1. Run the pre-flight soft gate: load the `pre-flight`
   skill (invoke the `skill` tool with name `pre-flight`)
   in `soft-gate` mode and execute ALL detected checks
   without stopping at the first failure -- record every
   exit code and output.
   - If all checks pass: proceed to the dispatch below.
   - When any check fails, establish a baseline per the
     skill's Phase 4a (Tier 1: CI API via `gh`; Tier 2:
     local worktree fallback), then classify each
     failure per its Phase 4b as `branch-caused`,
     `pre-existing`, or `unknown` (unknown is treated as
     branch-caused).
   - **Branch-caused (or unknown) failures**: STOP
     before dispatching any reviewers. Report each
     failure as a CRITICAL finding with full output.
     Finalize the dispatch fail-closed with NO child
     reviewer runs (a dispatch with zero executed
     reviewers, verdict UNAVAILABLE), then **EXIT** by
     calling `format_unleash_exit` with:

     ```
     format_unleash_exit
       variant: "code-review-preflight"
       findings: [branch-caused failures with full output]
     ```

     Emit the returned `{text}` verbatim. Rendered
     shape:

     ```
     ## /uf.unleash paused at: code review

     **Reason**: Pre-flight gate: branch-caused failures

     ### Findings

     [list each branch-caused failure as a CRITICAL
     finding with its full output]

     ### What to do next
     Fix the branch-caused failures, then re-run
     `/uf.unleash`.

     ### Then resume
     Run `/uf.unleash` to continue from code review.
     ```

   - **Pre-existing failures**: record them for the
     final report; they are non-blocking. Proceed.
   - **Gaze Phase 1b** (conditional, informational): if
     Gaze is not installed, skip Phase 1b with an
     informational note. This is non-blocking -- code
     review proceeds without Gaze quality data. When
     Gaze is installed, run Phase 1b as specified in the
     cited "Code Review Mode" section.

2. Dispatch the review council directly -- the same
   sequence as Step 4, with mode `code`:
   a. Announce: "Code review starting -- dispatching the
      review council directly via the review-dispatch
      plugin (no child driver session)."
   b. Call `resolve_base_ref` (no network access) and
      announce the resolved base ref and its SHA. SHA
      and ref validation failures MUST stop the step
      (fail-closed, no fallback).
   c. Capture the immutable input context:
      - Resolve the head SHA via `git rev-parse HEAD`.
      - Capture tracked changes via
        `git diff <base_sha> -- .` and untracked files
        via `git ls-files --others --exclude-standard`
        (treated as full-content additions in the diff).
      - Save the combined diff to a file.
      - Derive the raw `changed_files` list with
        per-file insertion/deletion counts.
      - If HEAD equals the base SHA and the working
        tree carries the change (no commits ahead), the
        input context is the uncommitted local path:
        `uncommitted: true` with `pr_number: null`.
   d. Discover reviewer agents: enumerate the regular
      `divisor-*.md` files in `.opencode/agents/`,
      strip the `.md` extension, and sort the list.
      Zero discovered reviewers MUST stop the step
      (fail-closed).
   e. Load the `dispatch-advisor` skill, then call
      `plan_review_dispatch` with mode `code`,
      `full: false`, `augment: false`, and the
      `changed_files` list. Display the plan JSON
      exactly as returned. Proceed only when the plan
      status is `ready`, `workflow_result` is null, and
      `errors` is empty; otherwise finalize the failed
      dispatch and exit.
   f. Call `dispatch_review_runs` exactly once with mode
      `code`, command `review-council`, `diff_path` (the
      saved diff file), `changed_files`, `input_context`,
      `plan_entries`, `session_metadata` (command, mode,
      full, input context, change profile, plan,
      coverage), and the plan limits (`max_parallel_runs`,
      `budget_usd`, `per_run_timeout_ms`). Pass the
      soft-gate results as `pre_flight_results` (verdict,
      causality classifications, baseline method). Then
      call `consolidate_dispatch` exactly once per
      finalization attempt with provenance: branch,
      40-character head SHA, and
      `workflow_id: "uf.review-council"`.

**Processing results**:

- If the verdict is APPROVE or APPROVE WITH ADVISORIES
  (at least one successful reviewer assessment is
  required for a valid verdict): record any advisories
  for the final report and proceed to step 7.

- If the verdict is REQUEST CHANGES: enter the fix loop.
  For each iteration (up to 3 total):
  a. Address the findings by making code fixes --
     delegate the code-fix application to the
     `cobalt-crush-dev` agent via `uf_delegate_command`,
     prompt-only (fix application is content work, not
     review driving -- code fixes proceed without a human
     decision):

     ```
     uf_delegate_command
       prompt: [the findings to fix, exactly as reported]
       feature_dir: FEATURE_DIR
     ```

     The code-fix call omits `command_path` and records no
     `checkpoint_step`; the iteration CHECKPOINT below
     remains the review-loop record. On failure, emit the
     envelope's error and **STOP**.
  b. Re-run the review: re-resolve the immutable input,
     re-validate the full plan, and rerun every included
     reviewer (not just failing or content-affected
     ones), reusing a single sibling-evidence
     acquisition across the iteration, and again
     passing fresh `pre_flight_results` from a re-run
     of the soft gate. Keep the iteration counter.
  c. If the verdict is APPROVE or APPROVE WITH
     ADVISORIES: proceed to step 7.

  > CHECKPOINT: Call `checkpoint` with `command:
  > "uf.unleash"`, `step: "code-review"`, and
  > `data: '{"iteration": N}'`.

- If the verdict is INCONCLUSIVE or UNAVAILABLE (no
  successful reviewer assessment, on the initial run or
  any re-run): **EXIT** by calling `format_unleash_exit`
  with:

  ```
  format_unleash_exit
    variant: "code-review-no-success"
    reasons: [which reviewers ran or failed, and why]
  ```

  Emit the returned `{text}` verbatim. Rendered shape:

  ```
  ## /uf.unleash paused at: code review

  **Reason**: Code review produced no successful
  assessment

  ### No-success reasons

  [list which reviewers ran or failed, and why]

  ### What to do next
  Address the reviewer-run failures, then re-run
  `/uf.unleash`.

  ### Then resume
  Run `/uf.unleash` to continue from code review.
  ```

- If 3 iterations are exhausted with remaining findings:
  **EXIT** by calling `format_unleash_exit` with:

  ```
  format_unleash_exit
    variant: "code-review-iterations-exhausted"
    persistent_findings: [findings that persist across
      iterations, noting fixed vs. remaining]
    circular_dependencies: [reviewer-check cycles, if any]
  ```

  Emit the returned `{text}` verbatim. Rendered shape
  (`circular_dependencies` is optional -- pass it only
  when cycles exist):

  ```
  ## /uf.unleash paused at: code review

  **Reason**: 3 review iterations exhausted

  ### Persistent findings

  [list each finding that persists across iterations,
   noting which were fixed vs. which remain]

  ### Circular dependencies (if any)

  [if fixing one reviewer's finding causes another
   reviewer's check to fail, describe the cycle]

  ### What to do next
  Fix the outstanding findings manually, then re-run
  `/uf.unleash`.

  ### Then resume
  Run `/uf.unleash` to continue from code review.
  ```

Proceed immediately to Step 9. Do NOT ask for confirmation.

### 9. Step 7 -- Retrospective

Analyze the session and store learnings in semantic
memory.

1. Review the session: tasks completed, review findings
   encountered, fixes applied, patterns discovered.

2. Compose at least one learning as a natural language
   paragraph (Dewey's semantic search works best on
   narrative text, not bullet lists). Categorize each
   learning as one of:
   - **Patterns**: coding/design patterns that worked
     well
   - **Gotchas**: unexpected issues or edge cases
   - **Review Insights**: what the review council found
     and how it was fixed
   - **File-Specific**: learnings about specific files
     that future workers should know

3. **If Dewey is available** (`dewey_store_learning` tool
   exists): store each learning via `dewey_store_learning`
   with tags including:
   - The branch name (e.g., `018-unleash-command`)
   - The current date (e.g., `2026-03-29`)
   - The learning category (e.g., `pattern`, `gotcha`,
     `review-insight`, `file-specific`)

4. **If Dewey is NOT available**: skip the storage
   step with an informational note:
   > "Dewey not available -- retrospective learnings
   > not stored. Install Dewey for semantic memory."

   Display the learnings in the output so they are not
   lost.

> POLICY NOTE: Learnings stored via `dewey_store_learning`
> produce files (`.uf/dewey/learnings/*.md`,
> `.uf/dewey/compiled/*.md`) that are part of the feature
> PR scope and MUST be committed on the feature branch.
> See the Commit scope rule in `AGENTS.md`.

Proceed immediately to Step 10. Do NOT ask for confirmation.

### 10. Step 8 -- Demo

Present structured demo instructions to the developer.

1. **What Was Built**:
   - **If `WORKFLOW_TIER = speckit`**: read the spec's
     user story titles and descriptions from
     `FEATURE_DIR/spec.md`. Summarize what was
     implemented.
   - **If `WORKFLOW_TIER = openspec`**: read the change
     proposal from `FEATURE_DIR/proposal.md`. Summarize
     what was implemented.

2. **How to Verify**:
   - **If `WORKFLOW_TIER = speckit`**: read
     `FEATURE_DIR/quickstart.md` if it exists. If not,
     generate verification steps from the acceptance
     scenarios in `FEATURE_DIR/spec.md`.
   - **If `WORKFLOW_TIER = openspec`**: generate
     verification steps from the acceptance scenarios
     in `FEATURE_DIR/tasks.md`. OpenSpec changes do not
     have a `quickstart.md`.

3. **Test Results**: summarize the test output from the
   most recent build/test checkpoint.

4. **Next Steps**: the tool renders the two prescribed
   options -- the fixed `/uf.finale` option and the
   tier-selected refinement option.

   **Note**: The pre-PR `/uf.review-council` requirement
   is already satisfied by Step 8 (Code Review). Do NOT
   re-suggest `/uf.review-council` or hand-roll git
   commit/push/PR steps in the demo output.

Render the demo block by calling `format_unleash_demo`
with the composed values (the tool auto-checkpoints
`demo` on success):

```
format_unleash_demo
  tier: WORKFLOW_TIER
  whatWasBuilt: [What Was Built summary]
  howToVerify: [How to Verify steps]
  testResults: [Test Results summary]
  changeName: [change name]
```

Emit the returned `{text}` verbatim. Rendered shape:

```
## What Was Built

[summary from spec user stories]

## How to Verify

[verification commands from quickstart.md or acceptance
 scenarios]

## Test Results

[pass/fail summary with counts]

## Next Steps

- Run `/uf.finale` to create PR and watch CI
- [tier-specific refinement option selected above]
```

Then persist the summary for `/uf.finale` by calling
`write_unleash_summary` with the same demo values plus
the review-gate verdicts recorded in Steps 6 and 8 and
the learnings stored in Step 9:

```
write_unleash_summary
  change_name: [change name]
  tier: WORKFLOW_TIER
  feature_dir: FEATURE_DIR
  review_verdicts: {spec_review?: {verdict, iterations},
                    code_review?: {verdict, iterations}}
  learnings_stored: [learning identifiers or file paths]
  whatWasBuilt: [same value as the demo call]
  howToVerify: [same value as the demo call]
  testResults: [same value as the demo call]
```

The demo values are the markdown bodies of the three
presented sections, excluding their `##` headers. If
the tool fails, warn the developer and continue —
never abort the demo step or the pipeline; `/uf.finale`
retains its no-artifact fallback.

> Call `clear_progress` with `command: "uf.unleash"` to
> clean up progress state. Pipeline complete.

## Guardrails

- **NEVER pause between steps to ask for human
  confirmation** -- proceed immediately from one step to
  the next. The single exception is the spec auto-fix
  consent gate in Step 4: when a spec review returns
  REQUEST CHANGES with only LOW/MEDIUM findings, the
  question tool MUST be presented before any spec
  artifact is modified. That gate is the only legitimate
  mid-pipeline human interaction. The valid reasons to
  exit the pipeline are: unanswerable clarification
  questions, HIGH/CRITICAL spec findings, build/test
  failures, merge conflicts, and 3 review iterations
  exhausted. All other transitions are autonomous.
- **NEVER run on `main`** -- the command is for Speckit
  (`NNN-*`) and OpenSpec (`opsx/*`) feature branches
- **NEVER skip spec review exit on HIGH/CRITICAL** --
  these findings block implementation to prevent wasted
  effort on a flawed spec
- **NEVER merge worktrees with unresolved semantic
  conflicts** -- conflict markers in files after
  cherry-pick mean the merge failed and requires human
  resolution
- **ALWAYS present exit messages with actionable next
  steps** -- every exit point must tell the developer
  what happened, what to do, and how to resume
- **ALWAYS store at least one learning in retrospective**
  -- the retrospective is the swarm's memory; skipping
  it means the same mistakes will be repeated
- **ALWAYS clean up worktrees** -- stale worktrees waste
  disk space and can cause confusion on re-runs
- **NEVER create WorkflowInstance objects** -- `/uf.unleash`
  operates at the Speckit pipeline level, not the hero
  lifecycle workflow level (Specs 008/012/016)
- **NEVER hardcode build/test commands** -- load the
  `pre-flight` skill to derive them from
  `.github/workflows/` and local tool configs
- **NEVER improvise exit or demo text** -- exit output
  MUST be produced by calling `format_unleash_exit` and
  demo output by calling `format_unleash_demo`, emitting
  the returned text verbatim; never reconstruct it from
  memory or paraphrase it

</protect>
