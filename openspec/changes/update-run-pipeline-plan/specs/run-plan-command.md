## MODIFIED Requirements

### Requirement: Per-Item Pipeline Protocol

For each work item, the orchestrator MUST execute exactly two
pipeline delegations sequentially, each through
`uf_delegate_command` with a `command_path` pointing at the repo
command file (delegations run the default cobalt-crush-dev content
agent in parented child sessions; command-path delegations carry
no task classification):

1. **Delegation 1 -- `/uf.unleash`**: `command_path:
   ".opencode/commands/uf.unleash.md"` with a prompt carrying the
   work item's description and issue reference(s). The child
   resolves the issue reference, routes the workflow tier, runs
   the tier's entry command itself, and executes the pipeline
   through the demo step. Expected outcome: the pipeline completes
   and presents the demo block (What Was Built / How to Verify /
   Test Results / Next Steps); the working tree is left on the
   item's feature branch.
2. **Delegation 2 -- `/uf.finale`**: delegated only after the
   `/uf.unleash` pipeline completes. `command_path:
   ".opencode/commands/uf.finale.md"` with a prompt carrying the
   work-item context (the PR targets the parent
   `unbound-force/unbound-force` repo). `/uf.finale` runs its nine
   steps -- branch safety gate, check for changes and stage,
   commit message, sync with base branch, push, create or find PR,
   watch CI checks, return to main, summary. Expected outcome:
   changes committed and pushed; a PR URL returned; the PR stays
   open for human review; `Closes #N` threaded via
   `originating_issue` in `.openspec.yaml`; the working tree left
   back on `main`.

The orchestrator MUST NOT delegate `/opsx-propose` (or any tier
entry command) directly -- tier routing inside `/uf.unleash` owns
entry-command delegation. The orchestrator MUST NOT pass
`checkpoint_step` or `expected_artifact` on either delegation: the
delegated commands own their durable progress state, and the
orchestrator's record is the todowrite tracker plus disk state.

Before delegating `/uf.finale`, the orchestrator MUST verify on
disk that the working tree is on the item's feature branch (not
`main`). After `/uf.finale` returns, the orchestrator MUST verify
that a PR exists for the item's branch and that the working tree
is on `main` with a clean working tree (`git status --short` is
empty) before the next item starts.

Previously: the orchestrator spawned three fresh `general`
subagents per item (`/opsx-propose`, then `/uf.unleash` in
OpenSpec mode, then `/uf.finale`), verifying artifacts on disk
between each.

#### Scenario: Two delegations per work item

- **GIVEN** a confirmed work item is being executed
- **WHEN** the per-item pipeline protocol runs
- **THEN** the orchestrator MUST issue exactly two
  `uf_delegate_command` calls -- `/uf.unleash` first, `/uf.finale`
  second
- **AND** it MUST NOT issue a direct delegation to
  `/opsx-propose` or any other tier entry command

#### Scenario: Unleash delegation carries the issue reference

- **GIVEN** work item 1 references issue `#42` with description
  "Fix token validation"
- **WHEN** the orchestrator composes the `/uf.unleash` delegation
  prompt
- **THEN** the prompt MUST carry the description and the `#42`
  reference
- **AND** the child session resolves the issue, routes the
  workflow tier, and runs the entry command itself

#### Scenario: Finale delegated only after the demo completes

- **GIVEN** the `/uf.unleash` delegation for a work item returned
  a paused exit
- **WHEN** the orchestrator decides whether to delegate
  `/uf.finale`
- **THEN** it MUST NOT delegate `/uf.finale`
- **AND** it MUST apply the paused-exit handling protocol instead

#### Scenario: Disk handoff verified before finale

- **GIVEN** the `/uf.unleash` delegation completed with the demo
  block presented
- **WHEN** the orchestrator prepares the `/uf.finale` delegation
- **THEN** it MUST verify the working tree is on the item's
  feature branch (not `main`)
- **AND** after `/uf.finale` returns it MUST verify a PR exists
  for the item's branch and the tree is back on `main`, clean

#### Scenario: Clean tree between items

- **GIVEN** work item 1 has completed (PR created)
- **WHEN** the orchestrator prepares to start work item 2
- **THEN** the working directory MUST be on `main` with a clean
  working tree (`git status --short` is empty)

### Requirement: Guardrails

The command MUST enforce the following guardrails:

- **Scaffold drift sync**: Any canonical `.opencode/` or
  `openspec/` change MUST sync its
  `internal/scaffold/assets/...` copy byte-identically, else
  `TestEmbeddedAssets_MatchSource` fails
- **Explicit staging**: The orchestrator MUST NOT stage or commit
  anything itself — staging happens inside the delegated commands
  under their own contracts. Should the orchestrator ever stage
  files, it MUST stage explicitly; `git add -A` and `git add .`
  are forbidden at the orchestrator level
- **Stray file removal**: Any untracked
  `internal/scaffold/AGENTS.md` MUST be removed before staging
  (never commit it)
- **No force-push**: `git push --force` is forbidden. Only
  `git push --force-with-lease` is allowed
- **PR targeting**: PRs MUST target the parent
  `unbound-force/unbound-force` repo with head `jflowers:<branch>`
- **Closes linkage backstop**: `/uf.finale` threads `Closes #N`
  into the PR body from `originating_issue`; the orchestrator
  MUST verify the created PR body contains `Closes #N` for each
  issue in the work item (via `gh pr view <N> --json body`) and,
  when a line is missing, append it via `gh pr edit <N>`
- **No auto-merge**: The PR MUST NOT be merged automatically; it
  stays open for human review

Previously: the Closes linkage guardrail required the orchestrator
to embed `Closes #N` in the commit message and PR body directly;
linkage now flows from `originating_issue` with the orchestrator
verifying as backstop.

#### Scenario: Staging happens inside delegated commands

- **GIVEN** the two-delegation protocol is in effect
- **WHEN** a work item's changes are staged and committed
- **THEN** the staging and commit MUST happen inside the delegated
  command's child session under its own command contract
- **AND** the orchestrator MUST NOT stage or commit anything
  itself; it verifies outcomes (PR URL, clean tree on `main`)
- **AND** any staging the orchestrator ever performs MUST use
  explicit file paths, never `git add -A` or `git add .`

#### Scenario: PR targeting parent repo

- **GIVEN** the `/uf.finale` delegation is creating a PR
- **WHEN** the PR is created
- **THEN** the PR MUST target the parent
  `unbound-force/unbound-force` repo with head `jflowers:<branch>`

#### Scenario: Closes linkage backstop

- **GIVEN** the PR for work item 1 (issue `#42`) was created, and
  its body lacks `Closes #42`
- **WHEN** the orchestrator verifies linkage
- **THEN** it MUST append `Closes #42` to the PR body via
  `gh pr edit`
- **AND** report the backstop repair in the run output

#### Scenario: No force-push

- **GIVEN** any push performed during the run
- **WHEN** a push is issued
- **THEN** it MUST NOT use `--force`
- **AND** it MAY use `--force-with-lease`

### Requirement: Progress Tracking

The orchestrator MUST maintain a `todowrite` tracker with one
entry per work item. An entry MUST be marked complete only after
the item's PR is created AND CI checks on the PR are green
(verified via `gh pr checks <N>`). A work item blocked by a
`/uf.unleash` paused exit MUST remain `in_progress` with the
paused variant annotated in the entry text (e.g., `[BLOCKED:
clarify]`); subsequent re-runs of the same item continue under the
same entry.

Previously: entries were marked complete after PR creation and
green CI with no blocked-state annotation.

#### Scenario: Todowrite entry per item

- **GIVEN** a plan with 3 work items
- **WHEN** the orchestrator starts execution
- **THEN** `todowrite` MUST contain 3 entries, one per work item

#### Scenario: Entry marked complete

- **GIVEN** work item 1's PR has been created
- **AND** `gh pr checks <N>` reports all checks passing
- **WHEN** the orchestrator updates `todowrite`
- **THEN** the entry for work item 1 MUST be marked complete

#### Scenario: Entry not marked complete prematurely

- **GIVEN** work item 2's PR has been created
- **AND** CI checks are still pending or failing
- **WHEN** the orchestrator checks `todowrite`
- **THEN** the entry for work item 2 MUST NOT be marked complete

#### Scenario: Blocked item annotated

- **GIVEN** the `/uf.unleash` delegation for work item 3 returned
  a paused exit with variant `implement-phase-checkpoint`
- **WHEN** the orchestrator applies the paused-exit handling
- **THEN** the entry for work item 3 MUST remain `in_progress`
  with the paused variant annotated in its text

## ADDED Requirements

### Requirement: Direct Human Gate Surfacing

Human gates inside delegated commands MUST surface directly to the
human through the parented child sessions. The orchestrator MUST
NOT relay gates through structured values (`GATE:<name>`), MUST
NOT resume children via `task_id` to deliver gate answers, and
MUST NOT instruct children to avoid the question tool. The
orchestrator's own question-tool use MUST be limited to Phase 0
triage and pause-relay decisions.

#### Scenario: Child gate surfaces directly

- **GIVEN** the `/uf.unleash` child session reaches a mandatory
  human gate (e.g., the spec review decision gate)
- **WHEN** the gate fires
- **THEN** the child's question MUST surface directly to the human
  from the parented child session
- **AND** the orchestrator MUST NOT receive or relay a
  `GATE:<name>` structured value

#### Scenario: Orchestrator question scope

- **GIVEN** a run is in progress past Phase 0
- **WHEN** the orchestrator considers invoking the question tool
- **THEN** it MUST only do so for a pause-relay decision (a
  `/uf.unleash` paused exit, a delegation failure, or
  non-green CI on a created PR)

### Requirement: Unleash Paused-Exit Handling

When the `/uf.unleash` delegation returns a paused exit -- output
containing a `/uf.unleash paused at:` heading rendered by
`format_unleash_exit` (known variants: clarify, spec-review,
implement-worker-failed, implement-merge-conflict,
implement-phase-checkpoint, code-review-preflight,
code-review-no-success, code-review-iterations-exhausted,
tier-routing-dirty-tree, tier-routing-missing-tooling,
planner-failure) -- the orchestrator MUST:

1. Relay the exit text verbatim
2. Mark the work item blocked in `todowrite` (entry stays
   `in_progress`, annotated with the paused variant)
3. ASK the human through a pause-relay question offering at
   least: re-run `/uf.unleash` after human action, skip the work
   item, or abort the run
4. On re-run, delegate `/uf.unleash` again via
   `uf_delegate_command` with the same `command_path` and no
   routing context -- the child re-anchors on the feature branch's
   durable state and resumes the pipeline from where it paused
5. Delegate `/uf.finale` only after a `/uf.unleash` run completes
   and presents the demo block. Orchestrated runs supersede the
   demo block's interactive next-step choice: its two options
   (run `/uf.finale` vs. tier-selected refinement) address
   interactive runs, and auto-delegating `/uf.finale` on demo
   completion is the designed behavior for orchestrated items.
   The remaining human control points are the Phase 0 work-item
   table confirmation, the `/uf.finale` child's commit and PR
   approval gates, pause-relay questions, and non-green CI on a
   created PR

A `/uf.unleash` delegation that fails outright (an error
envelope, or a return with neither exit text nor a completed
demo) MUST be handled through the same blocked protocol, with the
error relayed verbatim.

#### Scenario: Paused exit blocks the work item

- **GIVEN** the `/uf.unleash` delegation returns output
  containing `## /uf.unleash paused at: clarify`
- **WHEN** the orchestrator processes the return
- **THEN** it MUST relay the exit text verbatim
- **AND** mark the work item blocked in `todowrite` with the
  variant annotated
- **AND** present the pause-relay question
- **AND** MUST NOT delegate `/uf.finale`

#### Scenario: Re-run resumes from durable state

- **GIVEN** work item 2 is blocked on
  `implement-phase-checkpoint` and the human has resolved the
  build failure
- **WHEN** the human chooses to re-run in the pause-relay
  question
- **THEN** the orchestrator MUST delegate `/uf.unleash` again via
  `uf_delegate_command` with `command_path:
  ".opencode/commands/uf.unleash.md"`
- **AND** the child session MUST resume the pipeline from the
  feature branch's durable state rather than restarting

#### Scenario: Hard delegation failure blocks the work item

- **GIVEN** the `/uf.unleash` delegation returns an error
  envelope with neither paused-exit text nor a demo block
- **WHEN** the orchestrator processes the return
- **THEN** it MUST relay the error verbatim and apply the same
  blocked protocol as a paused exit

## REMOVED Requirements

### Requirement: Gate Relay Protocol

Reason: parented child sessions surface human gates directly to
the human, so the structured `GATE:<name>` return value, the
orchestrator question relay, and `task_id` subagent resumption no
longer exist as runtime mechanisms. Superseded by the "Direct
Human Gate Surfacing" requirement (ADDED).
