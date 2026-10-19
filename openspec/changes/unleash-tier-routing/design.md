## Context

`/uf.unleash` executes a deterministic pipeline gated by branch
name: `NNN-*` branches run the Speckit tier, `opsx/*` branches
run the OpenSpec tier. The gate (`uf_unleash_branch_gate` in
`internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`)
STOPs on `main` and unrecognized branches under the assumption
that spec work has already happened elsewhere. That assumption
is the gap: nothing in the ecosystem chooses the tier. The
engineer runs `/speckit.specify` or `/opsx-propose` by habit,
then invokes `/uf.unleash` to execute.

The pipeline machinery already supports everything routing
needs: `uf_delegate_command` for delegating to entry commands,
auto-checkpoints for progress, `format_unleash_exit` /
`format_unleash_demo` for terminal steps, and pure branch
classification in `lib/branch-classification.ts` shared with
`uf_finale_startup`. The `WORKFLOW_TIERS` constant in
`lib/unleash-templates.ts` is the single source of truth for
tier names and already ripples through exit and demo rendering.

Prior art for reference resolution exists in
`uf.run-pipeline-plan` (`gh issue view` with
`--json title,body,number`) and for untrusted-content handling
in `uf.triage-issue`. This change composes those patterns rather
than inventing new ones (Composability First).

## Goals / Non-Goals

### Goals

- One command from idea to demo: `/uf.unleash [description]`
  routes, plans, and executes without a manual pre-step.
- Autonomous tier selection by scope: speckit for strategic
  work, openspec for tactical work, quick for trivial work.
- Quick tier with full quality gates: implement, pre-flight
  checkpoint, review council, retrospective, demo.
- Issue-reference resolution (`#NNN`, issue URLs) with
  untrusted-content handling.
- Deterministic recording of routing decisions (Observable
  Quality) and tested tools for all deterministic behavior
  (Deterministic Execution).

### Non-Goals

- Routing on tier-named branches (branch name is committed
  intent; missing artifacts still STOP).
- PR-reference resolution (deferred; issues only).
- Confirming routing decisions with the user (fully autonomous
  by decision).
- Changing `/speckit.specify` or `/opsx-propose` internals.
- Version bump or release; siblings pick templates up on next
  re-scaffold.
- Re-routing mid-pipeline once a tier has started.

## Decisions

### D1: Fully autonomous routing, announced not confirmed

The routing step announces the tier, change name, and rationale,
then proceeds. Rationale: the decision is recoverable — a
mis-routed change costs a branch and some ceremony, and the
pipeline's value is uninterrupted flow. A confirmation gate
would reintroduce the manual handoff this change removes. The
announcement and recorded rationale keep the decision auditable
(Autonomous Collaboration: communicate through artifacts).

### D2: quick/<name> branches with full downstream gates

Quick changes get their own branch namespace rather than running
on the current branch. Clarify, plan, tasks, and spec review are
skipped (nothing to clarify against, no artifacts to produce);
implement, pre-flight checkpoint, review council (code mode),
retrospective, and demo all remain. Rationale: the gates that
protect quality are diff-based, not spec-based; only the steps
that consume spec artifacts are skippable. The branch keeps
`/uf.finale` able to open a PR and keeps the work off `main`.

### D3: Routing triggers are ON_MAIN and UNRECOGNIZED_BRANCH only

`NNN-*` and `opsx/*` branches with missing artifacts keep their
STOP behavior. Rationale: those branch names are committed
intent — silently routing around a typo'd `opsx/` branch name
would mask the problem and could discard the user's chosen
workflow. Routing exists precisely for the states where no
intent has been committed.

### D4: Rubric lives in a reusable tier-routing skill; risk floors escalate only

The rubric (scope signals, tier definitions) lives in
`skills/tier-routing/SKILL.md` because it is judgment, revised
by experience, and useful to any command that must pick a tier
— not just `/uf.unleash`. Risk floors (security-sensitive, auth,
data-loss, public-API-breaking) are hard minimums of openspec
and can only escalate. Issue labels may inform but never
override floors. Rationale: keeps judgment in prose where it
evolves, per the deterministic-execution split — everything
downstream of the judgment executes in tools.

### D5: uf_unleash_route_decision is deterministic and does the branch work

The tool takes `{tier, change_name, rationale, description,
issue_number?}` and does the mechanical parts: records the
decision with provenance, auto-checkpoints the route step, and
creates/switches to `quick/<name>` when tier is quick. For
speckit/openspec it does not create branches — the delegated
entry commands own that (`/speckit.specify` creates the `NNN-*`
branch; `/opsx-propose` works in the change directory).
Rationale: branch creation in the tool is testable with the
injected GitExec pattern; the child delegations keep their
existing contracts (Composability First).

### D6: Quick resumability via a progress artifact

Quick tiers have no tasks.md, so resume probing needs a marker
file. `.uf/artifacts/unleash/<branch>.md` holds step markers
written as the pipeline progresses. `uf_unleash_detect_resume`
on a quick branch treats clarify/plan/tasks/spec-review as done
and probes the artifact for implement, code-review, and later
markers. Rationale: preserves the "filesystem markers are
authoritative" guardrail — resume never depends on the model's
memory of a prior session.

### D7: WORKFLOW_TIERS gains quick and ripples everywhere at once

`WORKFLOW_TIERS` becomes `["speckit", "openspec", "quick"]`.
Every consumer — gate tier naming, `ExitTierSchema`,
`specReviewRecoveryGuidance`, `demoRefinementOption`, finale
branch handling — is updated in the same change. Rationale: a
partial rollout would let the schema reject valid tiers
mid-pipeline; the type system is the enforcement mechanism, so
the ripple is the safety property.

## Risks / Trade-offs

- **Empty child delegations**: a delegated `/speckit.specify`
  may return while producing nothing (learned from the
  `unleash-handoff-fix` incident class). Mitigation: the
  pipeline never trusts the child's self-report; it re-runs
  `uf_unleash_branch_gate` and STOPs on the gate's verdict.
- **Rubric mis-routing**: a small-looking change that balloons.
  Mitigation: risk floors catch the dangerous classes; the
  implement worker can surface scope surprises at the
  pre-flight checkpoint where a human already inspects.
- **vdev vs v0.17.0 divergence**: these templates are ahead of
  what siblings run. Accepted: divergence is the normal state
  between releases; the routing step only changes vdev
  behavior.
- **"Never run on main" guardrail softening**: routing now
  proceeds from `main` rather than STOPping. The invariant
  narrows to "never modify content on main" — the route tool
  creates and switches to `quick/<name>` (or the speckit child
  creates `NNN-*`) before any content work begins. The dirty
  tree guard protects uncommitted work during the switch.
- **Issue content as prompt-injection surface**: issue bodies
  are attacker-controllable text. Mitigation: data-only use
  (description into rubric), never instructions, mirroring
  `uf.triage-issue`'s untrusted-content guardrail.
