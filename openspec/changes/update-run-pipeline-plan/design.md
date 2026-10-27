## Context

`/uf.run-pipeline-plan`
(`.opencode/commands/uf.run-pipeline-plan.md`, mirrored at
`internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md`)
orchestrates a prioritized work plan through the Unbound Force
pipeline. It was written against a three-subagent protocol
(`/opsx-propose` -> `/uf.unleash` -> `/uf.finale`) with a Gate
Relay Protocol (`GATE:<name>` structured values, `task_id`
resumption) that predates two upstream shifts:

1. `/uf.unleash` gained tier routing: on `main` or an
   unrecognized branch it resolves the issue reference itself
   (`uf_unleash_resolve_issue`), applies the tier-routing rubric,
   records the decision (`uf_unleash_route_decision`), and
   delegates the tier's entry command (`/opsx-propose` or
   `/speckit.specify`) internally via `uf_delegate_command`. It
   also gained tool-rendered paused exits (`format_unleash_exit`)
   for eleven pipeline conditions, durable resumability
   (checkpoint state plus dispatch artifacts), and a demo step
   that precedes `/uf.finale`.
2. `/uf.finale` became a nine-step command (adding sync-with-base
   between commit and push) that threads `Closes #N` into the PR
   body from the originating issue (route-decision checkpoint or
   `originating_issue` in `.openspec.yaml`).

Meanwhile, repo-wide delegation moved from `general` subagent
spawning to `uf_delegate_command`: command-path based, running
the cobalt-crush-dev agent in parented child sessions where
human gates surface as tool-rendered paused exits.

The constitution alignment for this change is recorded in
`proposal.md` (all six principles PASS). The decisions below
trace to those principles where relevant.

## Goals / Non-Goals

### Goals

- Replace the three-subagent protocol with two
  `uf_delegate_command` delegations per work item: `/uf.unleash`
  (description + issue ref in, demo out), then `/uf.finale`
  (PR out).
- Route every child invocation through `uf_delegate_command`
  with `command_path`; remove all `general` subagent spawning.
- Remove the Gate Relay Protocol; gates inside delegated
  commands surface as tool-rendered paused exits (question-tool
  prompts inside a delegated child do not surface); the
  orchestrator's question-tool use is limited to Phase 0 triage
  and pause-relay decisions.
- Handle all `/uf.unleash` paused exits: verbatim relay, blocked
  todowrite annotation, pause-relay question, re-run delegation
  split by variant class (mid-pipeline variants resume from
  durable state; tier-routing variants restart with the work
  item's description re-supplied).
- Refresh the `/uf.finale` delegation description (nine steps,
  sync-with-base, expected outcome, `Closes #N` via
  `originating_issue` with a manual backstop).
- Keep Phase 0 triage, clean-tree-between-items, explicit
  staging, no force-push, PR targeting, no auto-merge, todowrite
  completion rules, and the session-resume guard.
- Sync the scaffold mirror byte-identically and add a CHANGELOG
  entry.

### Non-Goals

- No changes to `/uf.unleash.md`, `/uf.finale.md`, or any plugin
  tool — the orchestrator adapts to their current contracts.
- No changes to Phase 0 input handling, the Plan File Contract,
  or the input detection rules (kept verbatim).
- No Go/TypeScript runtime code changes; the deliverable is
  command instruction text plus its embedded mirror.
- No modification of any quality gate, threshold, or pinned
  dependency.

## Decisions

### D1: Two delegations, not three (Composability First)

`/uf.unleash` subsumes the `/opsx-propose` leg: its tier routing
resolves the issue reference, picks the tier, and delegates the
entry command itself. A separate orchestrator-level
`/opsx-propose` delegation would duplicate issue resolution,
hardcode the OpenSpec tier (routing may pick speckit or quick),
and pre-empt the route decision — a violated composition boundary
where the orchestrator reaches inside a composed command. The
orchestrator now delegates `/uf.unleash` with the work item's
description and issue reference and lets routing own everything
up to the pipeline. Phase 0's derived change names remain
provisional display labels; for plan-file input the `Change:`
name rides inside the description passed to the child, where the
tier-routing rubric consumes it.

### D2: `uf_delegate_command` parameters (Deterministic Execution)

Both delegations are command-path calls:
`command_path: ".opencode/commands/uf.unleash.md"` and
`command_path: ".opencode/commands/uf.finale.md"`. The command
file is the procedure of record, so the calls omit
`task_classification` (permitted for command-path delegations).
The calls also omit `checkpoint_step` and `expected_artifact`:
checkpoint state is branch-scoped and the delegated commands
manage their own durable progress under their command keys
(`uf.unleash`, `uf.finale`) — a parent-recorded step under those
keys could pollute a resumed child's `get_progress` reads. There
is no single artifact to verify for a whole-pipeline delegation;
the orchestrator verifies observable disk state instead (feature
branch checked out after unleash; PR exists, tree on `main`, clean
after finale). The orchestrator's own record remains todowrite
plus disk state, per its session-resume guard.

### D3: Direct gate surfacing (Autonomous Collaboration)

The Gate Relay Protocol is removed entirely: no `GATE:<name>`
structured values, no `task_id` resumption, no prohibition on
children invoking the question tool. Gates inside delegated
commands surface as tool-rendered paused exits: the child returns
its exit text and the orchestrator relays it verbatim. A
question-tool prompt inside a delegated child does not surface —
a parented child session cannot carry it to the human, and the
delegation wedges at the gate until its timeout; recovery is the
human clearing the gate interactively on the feature branch
before re-delegation, or the orchestrator re-anchoring via
`get_progress`/`parse_tasks`/git status and driving the remaining
steps directly, bounded to mechanical steps — any gate requiring
consent (committing, pushing, opening a PR) is answered by the
human through a pause-relay question before the orchestrator
executes the consented step. This removes an ad-hoc inter-agent
exchange format in favor of each command's own published exit
mechanism.
The orchestrator's question-tool scope is contractually limited
to Phase 0 triage and pause-relay decisions.

### D4: Paused-exit protocol (Observable Quality)

`/uf.unleash` exits are tool-rendered by `format_unleash_exit`
and always carry a `/uf.unleash paused at:` heading. The
orchestrator recognizes any such heading (the variant named in
the heading selects the re-run class below), relays the text
verbatim —
never paraphrased or reconstructed, per the tool-rendered output
rule — annotates the todowrite entry `[BLOCKED: <variant>]`
(entries have no blocked state; `in_progress` plus annotation is
the tracker's expression), and asks one pause-relay question:
re-run after human action, skip the item, or abort the run —
when the wedge is a consent gate (for example the finale commit
approval), the question relays the pending consent decision and
the orchestrator completes only the consented mechanical steps.
The
re-run is a fresh `uf_delegate_command` delegation with the same
`command_path` and no routing context — omitting orchestrator-
side tier and branch directives while the prompt still carries
the work item's description and issue reference(s) — split by
variant class: mid-pipeline variants re-anchor on the feature
branch's durable checkpoint/dispatch state and resume (the
orchestrator performs no resume bookkeeping itself), while
tier-routing variants (which fired inside
`uf_unleash_route_decision` before any branch or durable state
existed) restart fresh on `main`, the delegation prompt
re-carrying the description and issue reference(s) — without
them the child wedges asking what to build.
`/uf.finale` is delegated only after a run presents the demo
block. Orchestrated runs supersede the demo block's interactive
next-step choice — its two options address interactive runs;
auto-delegating finale on demo completion is the designed
behavior for orchestrated items (the remaining human control
points: Phase 0 work-item table confirmation, the delegated
commands' own gates — surfaced as paused exits or gate-timeout
wedges — pause-relay questions, and non-green CI on a created
PR). Hard delegation failures (error
envelopes, returns with
neither exit text nor demo) flow through the same blocked
protocol with the error relayed verbatim.

### D5: Finale description and Closes backstop

The `/uf.finale` delegation description in the command text is
refreshed to its current nine-step shape (branch safety gate,
check changes and stage, commit message, sync with base branch,
push, create or find PR, watch CI, return to main, summary) with
its expected outcome: a designed handoff at the commit-approval
gate — the child drives staging and commit preparation, then
wedges at its commit-approval question gate; the human completes
`/uf.finale` interactively on the feature branch, and the
orchestrator verifies the outcome on disk (PR URL returned, PR
stays open, tree back on `main`). `Closes #N` linkage is
automated through
`originating_issue` (threaded from the route-decision
checkpoint, which `/uf.unleash` re-keys under the feature branch,
or `.openspec.yaml`). The manual guardrail remains as backstop:
after the PR is created the orchestrator verifies the body via
`gh pr view <N> --json body` and appends any missing
`Closes #<N>` line via `gh pr edit <N>`, reporting the repair.
Appending only adds the required linkage line; it never rewrites
human-approved content.

### D6: Kept protocol surface

Phase 0 (input detection, `gh issue view` resolution,
non-mechanical flagging, work-item table confirmation), the Plan
File Contract, clean-tree-between-items, stray file removal
(enforced at the pre-finale disk-handoff verification), no
force-push, PR targeting, no auto-merge, the todowrite completion
rule (`[x]` only after PR created AND CI green, verified via
`gh pr checks <N>`), and the session-resume guard are all kept
with unchanged semantics. The explicit-staging guardrail is kept
but re-anchored: under the two-delegation protocol the
orchestrator stages and commits nothing — staging happens inside
the delegated commands under their own contracts (`uf_finale_stage`
within `/uf.finale`) — so the orchestrator-side obligation becomes
verification only, retaining the explicit-paths rule should the
orchestrator ever stage. Only the per-item execution protocol
around the kept surface changes.

### D7: Mirror sync and changelog (Testability)

The canonical command file is the single edit surface; the
scaffold mirror is then synced byte-identically (straight copy),
enforced by `TestEmbeddedAssets_MatchSource`. The file already
appears in `expectedAssetPaths`, so no manifest change is needed.
A `CHANGELOG.md` entry under `## Unreleased` -> `### Changed`
follows the repo's `- <change-name>: <summary>` format with a
`(Spec: openspec/changes/update-run-pipeline-plan/)` trailer,
matching the `rebase-upstream-before-push` precedent.

## Risks / Trade-offs

- **Wider blast radius via the scaffold.** The mirrored asset
  ships to every repo scaffolded by `uf init`; protocol changes
  propagate on the next scaffold sync. Accepted: the current
  text is actively wrong for today's delegation surfaces, so
  propagation is the fix, not the risk. The CHANGELOG entry and
  the documentation-gate assessment (tasks) cover the
  user-facing impact.
- **Child gates are no longer orchestrator-visible.** Gates
  surface only as tool-rendered paused exits (question-tool
  prompts inside a delegated child wedge until timeout), so the
  orchestrator cannot format or batch them. Accepted: this is
  the observed behavior of parented child sessions (learning
  `uf-workflow-20261026T182050`), and the per-finding formats
  the delegated commands render are richer than the relay ever
  was. The orchestrator's pause-relay decisions remain the
  coarse control point.
- **Whole-pipeline delegations can hit the timeout cap.** The
  `/uf.unleash` delegation sets `timeout: 1800000` (the
  `uf_delegate_command` maximum), and whole-pipeline runs have
  hit this cap (learning `uf-workflow-20261026T182050`). A
  duration overrun is not a hard failure: the timeout routes
  through gate-timeout recovery (human clears the gate on the
  branch, or the orchestrator re-anchors and drives the
  remaining mechanical steps). Per-task prompt-only delegations
  remain the prescribed granularity for implement work, which
  bounds per-delegation duration.
- **Recognition of completion relies on rendered shapes.** The
  orchestrator distinguishes "pipeline complete" (demo block)
  from "paused" (`paused at:` heading) by the child's final
  output. Both shapes are tool-rendered and stable
  (`format_unleash_demo`, `format_unleash_exit`), so the
  recognition rule keys on durable, tool-produced markers rather
  than free-form prose; ambiguous returns degrade into the
  blocked protocol rather than a false completion.
- **`gh pr edit` backstop mutates a reviewed artifact.** Appending
  `Closes #N` after the human approved the PR body is a narrow,
  reported, mechanical repair limited to the required linkage
  line. The alternative — STOP and report — would leave the
  MUST-linkage unenforced; the repair is chosen deliberately and
  documented in the run output.
