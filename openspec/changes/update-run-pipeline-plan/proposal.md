## Why

`/uf.run-pipeline-plan` was authored against an older pipeline shape
and has drifted from the current `/uf.unleash` and `/uf.finale`
command surfaces:

- **Three-subagent protocol is obsolete.** The command spawns a
  fresh `general` subagent for `/opsx-propose`, then `/uf.unleash`,
  then `/uf.finale`. `/uf.unleash` now owns that first leg itself:
  its tier-routing step resolves the issue reference mechanically
  (`uf_unleash_resolve_issue`), selects the workflow tier
  (speckit, openspec, or quick), and delegates the entry command
  (`/opsx-propose` or `/speckit.specify`) internally. Delegating
  `/opsx-propose` from the orchestrator duplicates issue
  resolution, hardcodes the OpenSpec tier (routing may pick
  speckit or quick), and pre-empts the route decision.
- **Legacy spawning model.** Spawning `general` subagents via the
  Task tool has been superseded by `uf_delegate_command`
  delegations: command-path based, running the cobalt-crush-dev
  agent in parented child sessions with host model resolution.
- **Gate Relay Protocol no longer matches runtime.** The
  `GATE:<name>` structured-value relay, `task_id` subagent
  resumption, and the "subagents MUST NOT invoke the question
  tool" rule predate parented child sessions, in which human gates
  inside delegated commands surface directly to the human.
- **Paused exits are unmodeled.** `/uf.unleash` now defines
  tool-rendered paused exit paths (`format_unleash_exit` variants:
  clarify, spec-review, implement-worker-failed,
  implement-merge-conflict, implement-phase-checkpoint,
  code-review-preflight, code-review-no-success,
  code-review-iterations-exhausted, tier-routing-dirty-tree,
  tier-routing-missing-tooling, planner-failure). The orchestrator
  has no protocol to relay them, block the work item, and resume.
- **Stale finale description.** `/uf.finale` now runs nine steps
  (including sync-with-base between commit and push) and threads
  `Closes #N` into the PR body from the originating issue
  automatically.

A command file that instructs the wrong protocol is worse than no
command: agents following it fight the tools, re-do work the
delegated commands own, and relay gates through a channel that no
longer exists. The drift must be repaired so the command matches
the delegation surfaces it drives.

## What Changes

1. **Two-delegation pipeline per work item.** Replace the
   three-subagent protocol (`/opsx-propose` -> `/uf.unleash` ->
   `/uf.finale`) with two `uf_delegate_command` delegations:
   first `/uf.unleash` with the work item's description and issue
   reference (the child resolves the issue, routes the tier, and
   runs the entry command itself); then, on completion, `/uf.finale`.
2. **uf_delegate_command everywhere.** All child work runs as
   command-path delegations to the cobalt-crush-dev agent in
   parented child sessions. No `general` subagent spawning remains.
3. **Gate Relay Protocol removed.** Human gates inside delegated
   commands surface directly to the human. The orchestrator's
   question-tool use is limited to Phase 0 triage and pause-relay
   decisions.
4. **Paused-exit handling added.** When the `/uf.unleash`
   delegation returns a paused exit, the orchestrator relays the
   exit text verbatim, marks the work item blocked, waits for
   human action, then re-runs `/uf.unleash` on the feature branch
   (resumability continues). `/uf.finale` is delegated only after
   the demo completes.
5. **/uf.finale delegation description refreshed.** Nine steps
   including sync-with-base; expected outcome is a PR URL, the PR
   stays open, and `Closes #N` flows via `originating_issue` in
   `.openspec.yaml`; the manual `Closes #N` guardrail is kept as a
   backstop.
6. **Kept unchanged.** Phase 0 triage (`gh issue view`,
   non-mechanical flagging, work-item table), clean-tree-between-
   items, explicit staging, no force-push (`--force-with-lease`
   only), PR targeting the parent repo, no auto-merge, todowrite
   tracking (`[x]` only after PR created AND CI green), and the
   session-resume guard.
7. **Scaffold mirror synced and changelog entry added.** The
   embedded copy under `internal/scaffold/assets/opencode/commands/`
   is synced byte-identical (enforced by
   `TestEmbeddedAssets_MatchSource`), and `CHANGELOG.md` gains an
   entry under Unreleased/Changed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-plan-command`: Per-item pipeline protocol becomes two
  `uf_delegate_command` delegations (`/uf.unleash`, then
  `/uf.finale` after the demo completes); gate handling moves from
  structured-value relay to direct surfacing in parented child
  sessions; progress tracking gains a blocked annotation for
  paused work items; the Closes linkage guardrail becomes a
  verification backstop over the automated `originating_issue`
  path.

### Removed Capabilities

None (the Gate Relay Protocol is removed as a requirement within
the `run-plan-command` capability; the capability itself remains).

## Impact

- **Files changed**:
  - `.opencode/commands/uf.run-pipeline-plan.md` (canonical
    command definition, full protocol rewrite)
  - `internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md`
    (embedded mirror, synced byte-identical)
  - `CHANGELOG.md` (Unreleased/Changed entry)
- **Behavior**: The command's per-item execution model changes for
  every consumer, including repos scaffolded by `uf init` (the
  asset ships in the scaffold). Human gates during delegated
  phases now surface from the child sessions directly rather than
  through orchestrator relay.
- **No runtime code changes**: this is a command-instruction and
  documentation change; no Go or TypeScript source is modified, no
  gates or thresholds are touched.
- **Verification**: scaffold drift detection
  (`TestEmbeddedAssets_MatchSource`) enforces byte-identity;
  `make check` replicates CI locally.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

The orchestrator collaborates with `/uf.unleash` and `/uf.finale`
through their published command contracts and tool-rendered
artifacts — tool envelopes, `format_unleash_exit` text, PR URLs —
rather than runtime coupling. Removing the Gate Relay Protocol
removes an ad-hoc exchange format (`GATE:<name>` structured
values) in favor of the delegated commands' own gate mechanisms.
Relaying paused-exit text verbatim preserves self-describing
outputs.

### II. Composability First

**Assessment**: PASS

The command remains independently runnable and now delegates only
to repo command files that each stand alone (`uf.unleash.md`,
`uf.finale.md`). Removing the separate `/opsx-propose` delegation
removes a redundant mandatory sequencing step: `/uf.unleash`
delivers its value alone, and the orchestrator composes it
additively with `/uf.finale`. No hero patching or forking is
introduced.

### III. Observable Quality

**Assessment**: PASS

Paused exits are relayed verbatim from `format_unleash_exit`
(tool-rendered, never reconstructed from prose). Item completion
remains evidence-backed: the todowrite `[x]` requires an observed
PR and green CI checks (`gh pr checks`), not a child's
self-report. Byte-identity between canonical and embedded command
files is enforced by an automated test, keeping the claim
reproducible.

### IV. Testability

**Assessment**: PASS

The behavioral contract is specified as Given/When/Then scenarios
in the spec delta, verifiable by inspection of the command
definition and by the existing scaffold drift test. No new
external services are required; verification commands (`make
check`, `go test ./internal/scaffold/...`) run locally.

### V. Security by Default

**Assessment**: PASS

No new dependencies, no new trust boundaries, and no gate changes.
Phase 0 issue resolution is unchanged and continues to treat issue
titles and bodies as untrusted description data. The kept
guardrails (no force-push, explicit staging, PR targeting) preserve
the existing security posture.

### VI. Deterministic Execution

**Assessment**: PASS (trade-off documented)

The change removes the Gate Relay Protocol's mechanical procedural
prose (structured-value choreography and `task_id` resumption
steps) and routes all child execution through `uf_delegate_command`
with `command_path` — the command file is the procedure of record.
Prescribed exit output stays tool-rendered (`format_unleash_exit`)
and is relayed verbatim.

The change does add orchestrator-side mechanical steps that have
no executable tool path today: the paused-exit heading-recognition
rule, the `[BLOCKED: <variant>]` todowrite annotation, the
disk-handoff verification loop (feature-branch check, PR
existence, `git status --short`), and the Closes-linkage backstop
(`gh pr view` / `gh pr edit`). Per the determinism pack's Conflict
Resolution rule this is a documented trade-off, not an asserted
pass: extracting these steps into executable plugin tools requires
the Go/TypeScript changes this change's Non-Goals exclude. Each
step names its exact command (`gh issue view`, `gh pr view`,
`gh pr checks`, `git status --short`), and extraction into
executable tools is recorded as follow-up for a plugin-side
change.
