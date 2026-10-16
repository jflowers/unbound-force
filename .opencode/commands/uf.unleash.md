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
> context summaries. Only checkpoint state is
> authoritative for resumability.
>
> Use the `checkpoint` tool to record progress after
> each step completes. Call `get_progress` on resume to
> check which steps are done. This is your live state
> record.

**Execution Checklist** -- tracked via `checkpoint` tool:

On startup, call `get_progress` with `command:
"uf.unleash"` to retrieve the current state. If state
exists, `completed_steps` shows which steps are done.
After completing each step, call `checkpoint` with
`command: "uf.unleash"` and `step: "step-N-name"` to
record progress. Include relevant data (iteration
counts, verdicts) in the `data` parameter as a JSON
string.

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

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "startup-cleanup"`. Proceed
> immediately to Step 1. Do NOT ask for confirmation.

### 1. Branch Safety Gate

Get the current branch:

```bash
git rev-parse --abbrev-ref HEAD
```

- If on `main`: **STOP** with error:
  > "Cannot run /uf.unleash on main. Must be on a Speckit
  > (`NNN-*`) or OpenSpec (`opsx/*`) feature branch."

- If on `opsx/*`: **OpenSpec mode detected.**
  Extract the change name from the branch:
  `opsx/<name>` → `<name>`.
  Set `FEATURE_DIR = openspec/changes/<name>/`.
  Set `WORKFLOW_TIER = openspec`.

  Check if `FEATURE_DIR/tasks.md` exists. If not:
  **STOP** with error:
  > "No tasks.md found for change `<name>`. Run
  > `/opsx-propose` first."

  Announce: "Detected OpenSpec change: `<name>`"

- If the branch matches `NNN-*` (digits followed by a
  dash): **Speckit mode detected.**

  Validate that spec.md exists by running from the repo
  root:

  ```bash
  .specify/scripts/bash/check-prerequisites.sh --json --require-spec
  ```

  If the script fails or no spec.md is found: **STOP**
  with error:
  > "No spec.md found in the feature directory. Run
  > `/speckit.specify` first."

  Extract the `FEATURE_DIR` from the JSON output. This
  is the working directory for all subsequent steps.
  Set `WORKFLOW_TIER = speckit`.

- If the branch does not match `NNN-*` or `opsx/*`:
  **STOP** with error:
  > "Unrecognized branch pattern. /uf.unleash requires a
  > Speckit feature branch (`NNN-*`) or OpenSpec branch
  > (`opsx/*`). Run `/speckit.specify` or
  > `/opsx-propose` to create one."

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "branch-safety-gate"`.
> Proceed immediately to Step 2. Do NOT ask for
> confirmation.

### 2. Resumability Detection

Probe filesystem state to determine which steps are
already complete. Check in order. **Important**:
compressed context summaries are NOT valid resumability
indicators -- only the filesystem markers listed below
are authoritative.

**If `WORKFLOW_TIER = openspec`**: checks 1-3 are always
"done" — these artifacts were created by `/opsx-propose`.
Skip directly to check 4.

1. **Clarify done?** *(Speckit only)* Read spec.md in
   the feature directory. Check for
   `[NEEDS CLARIFICATION]` markers.
   - If NO markers exist AND (a `## Clarifications`
     section exists in spec.md OR plan.md exists in the
     feature directory): clarify is done.
   - Otherwise: clarify is needed.

2. **Plan done?** *(Speckit only)* Check if `plan.md`
   exists in the feature directory.

3. **Tasks done?** *(Speckit only)* Check if `tasks.md`
   exists in the feature directory.

4. **Spec review done?** Call `get_progress` with
   `command: "uf.unleash"` and check if `spec-review`
   is in `completed_steps`.

5. **Implementation done?** Read `FEATURE_DIR/tasks.md`
   and check if all task checkboxes are `[x]` (no
   `- [ ]` lines remain in the task phases).

6. **Code review done?** Call `get_progress` with
   `command: "uf.unleash"` and check if `code-review`
   is in `completed_steps`.

Display the detection results. For OpenSpec mode:

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

Skip all steps that are detected as complete. Resume
from the first incomplete step.

If ALL steps are complete (all tasks done, tests pass):
skip directly to step 7 (retrospective) since it is
idempotent.

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "resumability-detection"`.
> Proceed immediately to Step 3. Do NOT ask for
> confirmation.

### 3. Step 1 -- Clarify

**If `WORKFLOW_TIER = openspec`**: skip this step.
Announce: "OpenSpec mode — clarify handled by
/opsx-propose."

Scan spec.md in the feature directory for
`[NEEDS CLARIFICATION]` markers.

**If no markers exist**: announce "No clarification
needed" and proceed to step 2.

**If markers exist**: for each marker:

1. Extract the question text from the marker (e.g.,
   `[NEEDS CLARIFICATION: What auth provider?]`).
2. Read 3-5 surrounding lines for context.
3. Formulate a targeted Dewey semantic search query by
   combining the question's topic keywords with the
   project domain (from the spec title and description).
   Do NOT use the raw `[NEEDS CLARIFICATION]` text
   verbatim as the query.

4. **If Dewey is available** (`dewey_semantic_search`
   tool exists): call `dewey_semantic_search` with the
   formulated query.
   - Evaluate the results using your judgment. If the
     results sufficiently answer the question:
     - Remove the `[NEEDS CLARIFICATION: ...]` marker
       from the spec text.
     - Write the answer inline where the marker was.
     - Add an entry to the `## Clarifications` section
       at the bottom of spec.md with the format:
       ```
       - Q: [original question] -> A: [answer]
         (Dewey-resolved from [page name or block UUID])
       ```
     - This is a silent auto-resolution -- do NOT ask
       the human for confirmation.
   - If the results are empty, off-topic, or do not
     sufficiently answer the question: add the question
     to the unanswerable list.

5. **If Dewey is NOT available**: add ALL questions to
   the unanswerable list. Note:
   > "Dewey not available -- all clarification questions
   > require human input."

**After processing all markers**:

- If the unanswerable list is empty: all questions were
  auto-resolved. Announce how many were resolved and
  proceed to step 2.
- If the unanswerable list is NOT empty: **EXIT** with
  all unanswerable questions presented at once:

  ```
  ## /uf.unleash paused at: clarify

  **Reason**: N question(s) require human input

  Q1: [question text]
  Context: [surrounding spec lines]

  Q2: [question text]
  Context: [surrounding spec lines]

  ### What to do next
  Answer these questions in the spec, then re-run
  `/uf.unleash`.

  ### Then resume
  Run `/uf.unleash` to continue from the plan step.
  ```

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "clarify"`. Proceed
> immediately to Step 4. Do NOT ask for confirmation.

### 4. Step 2 -- Plan

**If `WORKFLOW_TIER = openspec`**: skip this step.
Announce: "OpenSpec mode — plan handled by
/opsx-propose."

Generate the implementation plan by delegating to the
`cobalt-crush-dev` agent.

1. Read the full contents of
   `.opencode/commands/speckit.plan.md`.
2. Delegate to the `cobalt-crush-dev` agent via the Task
   tool, passing the plan command's instructions as the
   agent's prompt. Include the feature directory path so
   the agent knows where to write `plan.md`.
3. After the agent completes, verify that `plan.md` was
   created in the feature directory.
4. If `plan.md` was NOT created: **STOP** with error:
   > "Plan generation failed -- plan.md was not created.
   > Check the agent output for errors."

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "plan"`. Proceed
> immediately to Step 5. Do NOT ask for confirmation.

### 5. Step 3 -- Tasks

**If `WORKFLOW_TIER = openspec`**: skip this step.
Announce: "OpenSpec mode — tasks handled by
/opsx-propose."

Generate the task list by delegating to the
`cobalt-crush-dev` agent.

1. Read the full contents of
   `.opencode/commands/speckit.tasks.md`.
2. Delegate to the `cobalt-crush-dev` agent via the Task
   tool, passing the tasks command's instructions as the
   agent's prompt. Include the feature directory path.
3. After the agent completes, verify that `tasks.md` was
   created in the feature directory.
4. If `tasks.md` was NOT created: **STOP** with error:
   > "Task generation failed -- tasks.md was not created.
   > Check the agent output for errors."

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "tasks"`. Proceed
> immediately to Step 6. Do NOT ask for confirmation.

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
    branch below (tier-specific recovery guidance and
    the "paused at: spec review" exit template),
    making no spec edits.

  After consented fixes, re-run the review: re-resolve
  the immutable input, re-validate the full plan, and
  rerun every included reviewer (not just failing or
  content-affected ones), reusing a single
  sibling-evidence acquisition across the iteration.
  Keep the iteration counter. Each re-run verdict is
  processed through these same rules -- the gate
  re-presents on REQUEST CHANGES with only LOW/MEDIUM
  findings. Cap at 3 iterations: if REQUEST CHANGES
  persists to a fourth encounter, exit with the same
  tier-specific recovery guidance and exit template.

  > CHECKPOINT: Call `checkpoint` with `command:
  > "uf.unleash"`, `step: "spec-review"`, and
  > `data: '{"iteration": N}'`.

- If HIGH or CRITICAL findings remain after auto-fixing
  LOW/MEDIUM: **EXIT** with the findings. Use
  `WORKFLOW_TIER` to select the "What to do next"
  recovery guidance:
  - **If `WORKFLOW_TIER = speckit`**: "Run
    `/speckit.clarify` to address the findings, then
    re-run `/uf.unleash`."
  - **If `WORKFLOW_TIER = openspec`**: "Update the
    artifacts under `openspec/changes/<name>/` to
    address the findings, then re-run `/uf.unleash`."

  Before composing this exit message, re-read the
  `WORKFLOW_TIER` branch instructions immediately above
  to select the correct recovery guidance.

  ```
  ## /uf.unleash paused at: spec review

  **Reason**: HIGH/CRITICAL findings in spec artifacts

  ### Findings

  [list each HIGH/CRITICAL finding with context]

  ### What to do next
  [tier-specific recovery guidance from above]

  ### Then resume
  Run `/uf.unleash` to continue from spec review.
  ```

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "spec-review"`. Proceed
> immediately to Step 7. Do NOT ask for confirmation.

### 7. Step 5 -- Implement

Parse `FEATURE_DIR/tasks.md` for phases and execute
tasks.

**Derive build/test commands**: Load the `pre-flight`
skill (invoke the `skill` tool with name `pre-flight`)
and use its CI Workflow Parsing phase to discover the
exact CI commands from `.github/workflows/`. Also run
its Local Tool Detection phase to discover additional
tools from config files. This is the shared pre-flight
logic used by `/uf.review-council` and `/uf.review-pr`.

**For each phase in tasks.md**:

1. Separate tasks into two groups:
   - **Sequential** (no `[P]` marker): run first, in
     order
   - **Parallel** (`[P]` marker): run after sequential
     tasks complete

2. **Sequential execution**: for each non-`[P]` task,
   delegate to the `cobalt-crush-dev` agent via the Task
   tool with the task description as the prompt. After
   the agent completes, mark the task `[x]` in
   `tasks.md` immediately.

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

      > CHECKPOINT: Call `checkpoint` with `command:
      > "uf.unleash"`, `step: "implement"`, and
      > `data: '{"phase": N, "batch": M}'`.

   e. **If any worker fails**: stop spawning new workers
      (do not start the next batch). Wait for any
      already-running workers to complete or fail. Then
      call `forge_worktree_cleanup` with `cleanup_all:
      true` to remove all worktrees. **EXIT** with error
      context:

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
      - After each merge, check for conflict markers
        (`<<<<<<<`, `=======`, `>>>>>>>`) in the
        affected files.
      - If NO conflict markers remain: merge succeeded.
        Call `forge_worktree_cleanup` for that worktree.
      - If conflict markers remain: auto-resolution
        failed. Call `forge_worktree_cleanup` with
        `cleanup_all: true`. **EXIT** with conflict
        details:

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

   g. Mark each successfully merged `[P]` task as `[x]`
      in `tasks.md`.

   **If Swarm worktrees are NOT available**: fall back to
   sequential execution for `[P]` tasks. Announce:
   > "Swarm worktrees not available -- executing parallel
   > tasks sequentially. Install Replicator for
   > parallel execution."

   Execute each `[P]` task sequentially via the
   `cobalt-crush-dev` agent, same as non-`[P]` tasks.

   **Comms file reservations**: if `comms_reserve`
   is available, reserve file paths for each parallel
   worker before spawning. If Comms is NOT available,
   proceed without file locks -- worktree isolation
   provides sufficient protection for parallel workers.

4. **Phase checkpoint**: after all tasks in the phase
   are complete (both sequential and parallel), run the
   pre-flight skill in `hard-gate` mode to execute all
   detected CI and local tool commands.

   > CHECKPOINT: Call `checkpoint` with `command:
   > "uf.unleash"`, `step: "implement"`, and
   > `data: '{"phase": N, "status": "complete"}'`.

   - If all pass: proceed to the next phase.
   - If any fail: **EXIT** with the failure details:

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

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "implement"`. Proceed
> immediately to Step 8. Do NOT ask for confirmation.

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
     reviewers, verdict UNAVAILABLE), then **EXIT** with
     the failure details:

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
     `cobalt-crush-dev` agent via the Task tool (fix
     application is content work, not review driving --
     code fixes proceed without a human decision).
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
  any re-run): **EXIT** with the no-success reasons --
  which reviewers ran or failed, and why:

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
  **EXIT** with the persistent issues:

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

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "code-review"`. Proceed
> immediately to Step 9. Do NOT ask for confirmation.

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

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "retrospective"`. Proceed
> immediately to Step 10. Do NOT ask for confirmation.

### 10. Step 8 -- Demo

> **OUTPUT FIDELITY GUARD**: Before composing any demo
> output, re-read this Step 10 Demo section (from this
> heading through the CHECKPOINT blockquote below).
> The template is the sole authority for prescribed
> output format — NEVER reconstruct it from memory or
> compressed context summaries.

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

4. **Next Steps**: always present exactly these two
   options as shown in the format block below — do not
   paraphrase, add, or remove options. Use
   `WORKFLOW_TIER` to select the second option:
   - **If `WORKFLOW_TIER = speckit`**: "Run
     `/speckit.clarify` to refine and iterate"
   - **If `WORKFLOW_TIER = openspec`**: "Update the
     artifacts under `openspec/changes/<name>/` to
     refine and iterate"

   **Note**: The pre-PR `/uf.review-council` requirement
   is already satisfied by Step 8 (Code Review). Do NOT
   re-suggest `/uf.review-council` or hand-roll git
   commit/push/PR steps in the demo output.

Format the output as:

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

After presenting the demo output, call the
`persist_unleash_summary` tool with `whatWasBuilt`,
`howToVerify`, and `testResults` — the markdown bodies
of the What Was Built, How to Verify, and Test Results
sections you presented, excluding their `##` headers.
If the tool fails, warn the developer and continue to
the CHECKPOINT; never abort the pipeline.

> CHECKPOINT: Call `checkpoint` with `command:
> "uf.unleash"` and `step: "demo"`. Then call
> `clear_progress` with `command: "uf.unleash"` to
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
- **NEVER improvise Demo exit text** -- the "Next Steps"
  section in Step 10 prescribes the exact output; re-read
  and reproduce it verbatim

</protect>
