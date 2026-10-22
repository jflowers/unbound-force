## Context

A field audit of a complete `/uf.unleash` run (fullsend #8465,
session ses_ea1b11ed6ffeyKq5psxlUhMEbv, 2026-10-21) measured
the determinism refactor in production: the tool migrations
held their contracts, and every observed defect sat at a seam
the migrations did not reach. Eight findings, ranked by cost:

delegation dead all session on a variant-field hard failure
misclassified retryable; a post-compaction regression that
re-ran green work because a compression summary beat durable
state; prose diff capture that missed a git-ignored feature
directory and improvised a Python builder twice; tier routing
that recorded a tier whose entry commands were never
scaffolded; planner errors without remediation context;
mechanical work that skipped its repo skill; phase checkpoints
that were prose, uncached, and re-runnable; and exit paths with
no tool variant, forcing improvised stop text.

Two prior increments frame this change.
`unleash-compression-resilience` added prose guards for
compression failure modes -- the audit proved the
re-read-the-template guard ineffective in the field.
`unleash-deterministic-tools` migrated ten seams to plugin
tools -- the audit confirms those held and extends the same
treatment to the remaining seams. This change is the
audit-driven closing increment: the seams the field evidence
showed still leaking.

The audit also settled the temperature question: no defect
was caused by sampling randomness. Every finding has a
deterministic cause and a seam-level fix. This design
therefore changes no model or sampling configuration
(Gatekeeping Integrity also forbids it).

## Goals / Non-Goals

### Goals

- `uf_delegate_command` works on providers that do not
  populate a `variant` field, and its failure envelopes tell
  the truth about retryability.
- After any context compression, the pipeline re-anchors on
  durable state (`parse_tasks` + `get_progress`) and never
  re-runs a green phase checkpoint or re-verifies complete
  tasks.
- Review diff capture is one intent-level tool call that
  includes git-ignored feature files, excludes unrelated
  untracked noise, and falls back to uncommitted-local mode
  when the resolved base is not an ancestor of HEAD.
- Tier routing validates the chosen tier's entry commands
  before recording the decision.
- Planner errors carry actionable remediation, and a
  discovery/eligibility drift check runs before dispatch.
- Every stop path has a `format_unleash_exit` variant; the
  template names tools by their registered names; mechanical
  task descriptions name their skill or script.

### Non-Goals

- No agent temperature, model, or sampling changes (audit
  found no sampling-randomness defects; gate values are
  protected).
- No fullsend-side repairs: the `.uf/reviewer-capabilities.yaml`
  fix was applied in-session, the renumber-adr pagination bug
  is fullsend#3737, and tier validation makes the missing
  speckit scaffolds a clean stop rather than an ENOENT loop.
- No migration of phase pre-flight execution itself into a
  tool; this change adds durability (phase-scoped checkpoints
  with classified failure inventories) and an inventory-match
  rule, not a new pre-flight engine.
- No removal of TodoWrite; it is demoted to a display aid.
- No changes to the parallel worktree path beyond tool-name
  alignment.

## Decisions

### D1: Variant fallback with truthful retryability

`resolveHostModel` (.opencode/lib/agent-executor.ts:234-263)
returns a required non-nullable `variant`. When the parent
assistant message carries no variant field -- the documented
behavior of at least one provider -- resolution throws and
`uf_delegate_command` maps the failure to
HOST_MODEL_UNAVAILABLE with `retryable: true`
(uf-workflow/index.ts:1802), though the cause is structural.

Decision: make the resolved variant optional. When the parent
message carries model identity but no variant, spawn the child
without a variant override. Classify resolution failures by
cause: structural (no resolvable model, no variant where one
is required by an explicit request) is non-retryable and names
its remediation; only transient causes (e.g. session API
errors) remain retryable.

Alternative rejected: keeping the hard failure and relying on
the STOP contract. The audit showed the practical outcome is
not a stop but an undocumented fallback to hand-composed
native-task delegation, which is strictly worse than a working
tool.

### D2: Durable phase checkpoints and a re-anchor rule

The failed prose guard instructed the agent to re-read the
entire 1375-line template after compression. In the field it
was skipped, and the compression summary -- which described
Phase 4 work as needing verification -- overrode durable
tasks.md checkboxes.

Decision: the checkpoint tool becomes the record of truth at
phase granularity. After each green phase checkpoint, record a
phase-scoped checkpoint (`implement-phase-<N>`) carrying the
verdict and the classified failure inventory (pre-existing,
environmental, change-caused). Replace the re-read-the-template
guard with a re-anchor procedure: after any compression, call
`parse_tasks` and `get_progress`, treat those results as
authoritative over compression summaries, never re-run a
phase checkpoint already recorded green, never re-verify work
products of tasks marked complete.

The failure inventory also caches baseline-classification
work: a later phase matching a recorded failure signature
classifies without building a new clean-HEAD baseline worktree
(the audit paid ~40 minutes twice for the same environmental
failures).

Alternative rejected: plugin-side compression detection. No
compression hook exists in the plugin API, and the durable
records make detection unnecessary -- any resume path, not
only compression, benefits from the same anchor.

### D3: `capture_review_diff` with a shared lib core

Diff capture is a fixed chain: resolve base, detect topology,
enumerate files, numstat, save. The audit saw it fail twice on
a locally git-ignored feature directory and get improvised in
Python.

Decision: extract base-ref resolution with divergence
detection into `.opencode/lib/` (pure logic, injectable git
exec, mirroring the agent-executor pattern). Register
`capture_review_diff` in the review-dispatch plugin (the
consumer of `diff_path`), composing the shared core:
resolve base; if the base is not an ancestor of HEAD (stale
fork, base ahead), fall back to uncommitted-local mode with
the divergence recorded; assemble tracked changes plus
untracked and git-ignored files under the change's feature
directory (passed as a parameter from branch-gate output --
judgment stays at the boundary); exclude untracked noise
outside the feature directory; emit numstat; persist to a
bounded, traversal-safe, symlink-refusing path with size
caps, following the sibling-evidence patterns.

`resolve_base_ref` (uf-workflow/index.ts:43) delegates to the
same core and extends its structured output with the
divergence signal -- backward compatible, new optional fields
only.

Alternatives rejected: registering the tool in uf-workflow
(creates a consumer-side import inversion for review-dispatch
with no benefit); duplicating base logic in review-dispatch
(violates DRY and the lib pattern both plugins already use).

### D4: Tier tooling validation at route recording

The route decision validated risk floors, branch state, and
tree cleanliness, then recorded speckit for an install that
never scaffolded `speckit.specify.md` -- one ENOENT delegation
and a full re-route cycle later, the decision was re-recorded
and re-keyed.

Decision: `uf_unleash_route_decision` validates that the
chosen tier's entry command files exist on disk (speckit:
`speckit.specify.md`; openspec: `opsx-propose.md`; quick:
none required) before recording. On missing commands it
returns a validation error naming the missing paths and the
tiers whose entry commands do exist, records nothing, and the
command exits through the new tier-routing exit variant.

Alternative rejected: validating at delegation time. It is
too late -- the rubric analysis and route ceremony are already
spent, which is exactly the cost the audit measured.

### D5: Planner remediation and the drift check

Fail-closed held when reviewer discovery (agents directory)
and eligibility (`.uf/reviewer-capabilities.yaml`) drifted,
but the INCONCLUSIVE error carried no repair context, and ~15
investigation calls were spent producing a pointer the error
could have carried.

Decision: planner failures and INCONCLUSIVE results include
the missing or invalid entity, the configuration file and
entry to repair, and the discovered-versus-eligible lists. A
consistency check runs before plan finalization: discovered
agents without eligibility data fail the plan with the
remediation error; eligibility entries without a discovered
agent file produce a warning in the plan result.

Alternative rejected: auto-repairing the capabilities file.
User-owned configuration changes require consent; the error
contract delivers the repair to the operator in one read.

### D6: Exit variants and template hygiene

The "never improvise exit text" guardrail is unsatisfiable on
paths without a variant. Decision: `format_unleash_exit` adds
tier-routing failure (dirty tree after route analysis,
missing tier entry commands) and planner failure variants;
the template drops hand-composed exit prose on every covered
path. Template references align to registered tool names
(including MCP provider prefixes, e.g.
`replicator_forge_worktree_list`). The summary tool keeps a
single canonical registration (the canonical repo already
implements only `write_unleash_summary`; the audit's duplicate
was a downstream older scaffold -- verify the registration,
repair the stale `persist_unleash_summary` test labels, and
the `uf init` sync carries the fix downstream). TodoWrite is
demoted to a recommended display aid. Implement guidance
requires mechanical task delegations to name the repo skill
or script and pass the reference through to the child.

## Risks / Trade-offs

- **Variant fallback masks a needed variant.** If a provider
  requires a variant for correct routing, spawning without
  one could select a wrong default. Mitigation: fallback
  triggers only when the field is absent, never to override a
  present-but-invalid value, and unit tests cover both
  branches.
- **Re-anchor trusts stale durable state.** If a phase
  checkpoint is recorded green but the tree changed since,
  skipping re-verification could build on a broken state.
  Mitigation: the phase checkpoint is recorded only after the
  pre-flight gate passes on the current tree, and tasks.md
  checkboxes are the same durable source the sequential
  pipeline already trusts.
- **Divergence fallback narrows review scope.** A
  working-tree-only diff omits committed-but-unpushed work.
  Mitigation: the fallback and its reason are recorded in the
  structured output and surfaced in the review context; the
  existing uncommitted-local mode is the same posture the
  audit's judgment call produced.
- **Drift check fail-closed blocks dispatch on stale
  config.** That is the intended posture -- the alternative is
  the audit's INCONCLUSIVE with no repair pointer. The warning
  path covers benign staleness (eligibility without agent
  file).
- **Lib extraction touches two plugins at once.** Each
  seam migration carries DE-007 verification tasks:
  registration surface, documented output shape, and
  write-then-read round-trips for every moved or added tool.
- **Downstream lag.** Hero repos receive the fixes only via
  `uf init` sync; until then the old seams persist. Accepted
  (Composability First): unsynced repos keep functioning.

Constitution alignment is assessed per principle in
proposal.md; this design applies Principle VI (Deterministic
Execution) to the audit's own findings -- the remaining prose
procedures become tools or durable records, and tool error
contracts become truthful.

## Tool-name audit (task 6.4)

Renamed ten tool references in `.opencode/commands/uf.unleash.md`
to the registered Replicator MCP names, adding the provider
prefix: `forge_worktree_list` (2 occurrences),
`forge_worktree_cleanup` (4), `forge_worktree_create` (2),
`forge_spawn_subtask` (1), and `forge_worktree_merge` (1) --
e.g. `replicator_forge_worktree_list`. A template-wide grep
confirms no abbreviated `forge_*` references remain in
`uf.unleash.md`. Bare names persist in `forge.md` and
`forge-status.md`, which document the forge commands' own
tool surface and are out of this change's scope.
