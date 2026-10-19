## Why

`/uf.unleash` is positioned as the single autonomous pipeline:
one command from intent to demo. In practice it stops at the
planning boundary. The branch safety gate requires the workflow
tier to already be committed via branch name (`NNN-*` for
Speckit, `opsx/*` for OpenSpec), which means a human must run
`/speckit.specify` or `/opsx-propose` first. Two failure modes
result:

1. The tier decision happens before any scope analysis.
   Engineers pick a workflow by habit rather than by scope, so
   large changes sometimes land in OpenSpec under-planned, and
   trivial fixes either pay full spec ceremony or bypass the
   pipeline entirely — losing the review council, retrospective,
   and demo steps.
2. The one-command promise is broken: idea to demo requires at
   least two commands with a manual handoff between them.

In practice the scopes separate cleanly: SpecKit earns its
overhead for new capabilities and cross-cutting work, OpenSpec
for focused tactical changes, and a large class of trivial
fixes, chores, and docs need neither — only the quality gates.

## What Changes

Introduce a tier routing step in `/uf.unleash`, positioned
between the branch safety gate and resumability detection. When
the gate reports ON_MAIN or UNRECOGNIZED_BRANCH (the states that
mean "no spec has been committed to yet"), `/uf.unleash` gathers
a change description, applies a tier routing rubric, announces
its decision with rationale, and orchestrates the chosen tier:

- **speckit** — delegate to `/speckit.specify`, verify the
  resulting branch and spec via a branch-gate re-run, then
  continue the existing pipeline at clarify.
- **openspec** — delegate to `/opsx-propose`, verify the
  resulting change artifacts, then continue at spec review.
- **quick** (new tier) — create a `quick/<name>` branch and
  implement directly with no spec artifacts. Clarify, plan,
  tasks, and spec review are skipped; implement, the pre-flight
  checkpoint, code review council, retrospective, and demo all
  remain.

Supporting changes:

- A reusable `tier-routing` skill holds the routing rubric and
  risk floors (security-sensitive, auth, data-loss, or
  public-API-breaking changes floor at OpenSpec or above).
- `/uf.unleash` accepts a description argument. Issue references
  (`#NNN` or GitHub issue URLs) are resolved via
  `gh issue view --json title,body,number`; issue content is
  treated as untrusted data. If no argument is given, the
  pipeline asks one interactive question ("What do you want to
  build?").
- A new `uf_unleash_route_decision` tool deterministically
  records the routing decision, creates the `quick/<name>`
  branch when tier is quick, and auto-checkpoints the route
  step.
- Quick-tier progress is tracked in a
  `.uf/artifacts/unleash/<branch>.md` progress artifact so
  resumability detection stays filesystem-marker based.
- `WORKFLOW_TIERS` gains `quick`, rippling through the branch
  gate, resumability detection, exit/demo templates, and
  `/uf.finale` (which now supports `quick/*` branches and
  references the originating issue when one was resolved).

Routing is fully autonomous: the pipeline announces its tier
decision and rationale, then proceeds without a confirmation
gate. Branch names that already commit to a tier (`NNN-*`,
`opsx/*`) keep their current behavior — the branch name is
committed intent; missing artifacts under those prefixes still
STOP. The routing step only activates when no intent has been
committed.

## Capabilities

### New Capabilities

(none — all requirements land in the existing `unleash`
capability as new requirements)

### Modified Capabilities
- `unleash`: Adds the tier routing decision step, the quick
  workflow tier, the route decision tool, issue reference
  resolution, and quick-tier resumability requirements to the
  pipeline capability introduced by the pending
  `unleash-deterministic-tools` change.

### Removed Capabilities
(none)

## Impact

- `internal/scaffold/assets/opencode/commands/uf.unleash.md`
  (vdev template): new routing step, `$ARGUMENTS` description,
  issue-ref resolution guidance.
- `internal/scaffold/assets/opencode/skills/tier-routing/SKILL.md`
  (new): routing rubric and risk floors.
- `internal/scaffold/assets/opencode/lib/branch-classification.ts`:
  new `quick` branch type.
- `internal/scaffold/assets/opencode/lib/unleash-templates.ts`:
  `WORKFLOW_TIERS` gains `quick`; exit and demo template
  renderers handle it.
- `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`:
  gate accepts `quick/*`; new `uf_unleash_route_decision` tool;
  quick support in `uf_unleash_detect_resume`.
- `internal/scaffold/assets/opencode/plugins/uf-finale/index.ts`
  and `uf.review-council.md`: `quick/*` awareness; issue-number
  threading.
- `.opencode/test/`: new and updated tests for all of the above.
- `website` repo docs (`common-workflows.md`): routing guidance
  replaces the manual tier-selection advice.
- Divergence note: the vdev templates in this repo are ahead of
  the uf release that sibling repos last scaffolded (v0.17.0).
  Sibling repos pick this up on their next release re-scaffold;
  no back-port is attempted.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The routing decision is made autonomously and communicated
through artifacts: the route decision tool records a
machine-parseable decision with tier, change name, rationale,
and issue reference, and checkpoints it. No synchronous
interaction is required beyond the single up-front description
question when no argument is provided.

### II. Composability First

**Assessment**: PASS

Routing delegates to the existing entry commands
(`/speckit.specify`, `/opsx-propose`) through their documented
interfaces rather than duplicating them. The quick tier requires
no spec tooling at all, so `/uf.unleash` now delivers value on
repositories without OpenSpec or Speckit scaffolding. The
tier-routing skill is a standalone reusable asset.

### III. Observable Quality

**Assessment**: PASS

Every routing decision is recorded by a tested tool with JSON
output including provenance (tier, change name, rationale,
issue). The quick-tier progress artifact and existing checkpoint
system keep pipeline state inspectable end to end.

### IV. Testability

**Assessment**: PASS

Branch classification and template logic remain pure,
dependency-injected functions. Route decision, gate, and
resumability behaviors are covered by the existing node test
suite in `.opencode/test/` using injected git and filesystem
fakes.

### V. Security by Default

**Assessment**: PASS

Issue titles and bodies fetched via `gh` are untrusted data:
they are used as descriptive input to the rubric only, never
followed as instructions. `gh` failures (missing binary,
unauthenticated, issue not found) STOP the pipeline with the
underlying error. The dirty-tree guard prevents the routing step
from switching branches over uncommitted work.

### VI. Deterministic Execution

**Assessment**: PASS

Judgment lives in the rubric skill; the deterministic parts of
routing — recording the decision, creating the `quick/<name>`
branch, checkpointing, resume probing — execute in plugin tools
with tests, per the precedent set by
`unleash-deterministic-tools`.
