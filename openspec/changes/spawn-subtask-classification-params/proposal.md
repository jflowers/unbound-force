## Why

unbound-force/replicator#143 closed the tool-side gap that the
`delegation-skill-enforcement` change (#787) recorded as a design
Non-Goal: the forge spawn-subtask tool now carries the same
parameter-level delegation contract as `uf_delegate_command` --
`task_classification` (`deterministic` | `judgment`, required),
an existence-verified `skill` reference, a `skill_absent_reason`
escape hatch, and the deterministic-requires-reference-or-reason
rule, enforced fail-closed (`SKILL_REFERENCE_REQUIRED`,
`SKILL_NOT_FOUND`) before the subtask spawns. This repo's
replicator coordination surface already synced to that contract
(commit 19ca1d6, 2026-10-25: `forge.md`, `coordinator.md`,
`worker.md`, and the forge skills).

The `/uf.unleash` Swarm path did not sync, and its template text
is now wrong in both directions:

- **Stale statement of fact**: the implement step's
  parallel-execution spawn call block asserts "The spawn tool has
  no classification parameters, so the description is the
  contract's carrier on this path" -- false since the replicator
  release carrying #143.
- **Active regression**: `task_classification` is schema-required
  on the deployed spawn tool, so the template's prose-only,
  un-parameterized spawn calls fail input validation at spawn
  time. The Swarm parallel path is broken against the current
  replicator until the template passes the parameters.

The parent change closed this posture on `uf_delegate_command`
and deferred the Swarm path's tool-level validation to
Replicator (tracked by unbound-force/replicator#143, filed as
its task 5.5). With that issue shipped, the consumer-side update
-- passing the parameters from `/uf.unleash` -- had no tracked
closure; issue #830 (this change's originating issue) is that
vehicle.

## What Changes

1. **Spawn call block parameterized**: the implement step's
   parallel-execution item 3c in
   `.opencode/commands/uf.unleash.md` gains a fenced
   `replicator_forge_spawn_subtask` call block passing
   `task_classification` and, for deterministic tasks, the
   verified `skill` reference or `skill_absent_reason` --
   mirroring the `uf_delegate_command` call blocks -- and
   forwards the envelope's `skill_directive` verbatim when
   present. The description-carrier prose and the "no
   classification parameters" sentence are deleted. The
   classification step's cross-reference ("Swarm-path `[P]`
   delegations carry the same classification through the spawned
   subtask description") is updated to name the spawn
   parameters.
2. **Scaffold mirror**:
   `internal/scaffold/assets/opencode/commands/uf.unleash.md`
   updated byte-identically; drift-detection tests stay green.
3. **Governance wording** (assessed per the issue):
   - DE-008's Swarm-path clause in
     `.opencode/uf/packs/determinism.md` names the spawn tool's
     parameter contract as the carrier; the pack version bumps
     1.3.0 -> 1.4.0.
   - The Guard reviewer's Deterministic Delegation Discipline
     section (`.opencode/agents/divisor-guard.md` + scaffold
     mirror) drops "which has no parameter contract of its own"
     and audits spawn call parameters instead of prompt prose.
   - The determinism-first skill's Swarm-path sentence
     (`.opencode/skills/determinism-first/SKILL.md`) makes the
     same correction, and its Related Enforcement section's
     `uf_delegate_command` contract entry widens to name both
     delegation tools' contracts. The issue's list names DE-008
     and the Guard checklist; the skill carries the identical
     stale sentence from the same parent-change layer set, so it
     is included as an assessed addition rather than left for a
     follow-up change.
4. **Test pins**: the scaffold test pinning the spawn invocation
   extends to the parameter contract (`task_classification`,
   `skill`, `skill_absent_reason` present in the spawn call
   block; the stale sentence absent from both the canonical
   command and its mirror).
5. **Sequencing/compatibility**: forward-compatible by
   construction -- an updated template against an older
   replicator binary is a no-op pass-through, because Go's
   `json.Unmarshal` ignores unknown fields. The reverse
   direction was never compatible (`task_classification` is
   schema-required and fail-closed in the replicator#143
   release), which is why the template update lands alongside
   the replicator rollout already underway.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `unleash`: the implement step's Swarm parallel-path spawn call
  passes the delegation classification parameters as tool
  parameters; the description-carrier contract and its
  supporting statements are removed.
- `determinism-policy`: DE-008's Swarm-path clause, the Guard
  checklist's Swarm-path check, the determinism-first skill's
  delegation guidance, and the pack version bump reflect the
  spawn tool's parameter contract.

### Removed Capabilities

(none)

## Impact

**Files changed**:

- `.opencode/commands/uf.unleash.md` (spawn call block,
  classification-step cross-reference)
- `internal/scaffold/assets/opencode/commands/uf.unleash.md`
  (byte-identical mirror)
- `.opencode/uf/packs/determinism.md` (DE-008 Swarm-path
  clause; version 1.3.0 -> 1.4.0; repo-local, no mirror)
- `.opencode/agents/divisor-guard.md` (Deterministic Delegation
  Discipline section)
- `internal/scaffold/assets/opencode/agents/divisor-guard.md`
  (byte-identical mirror)
- `.opencode/skills/determinism-first/SKILL.md` (Swarm-path
  sentence + Related Enforcement entry; repo-local, no mirror)
- `internal/scaffold/scaffold_test.go` (spawn invocation pin
  extension)
- `CHANGELOG.md` (change record)

**Behavior**: the Swarm parallel path's spawn calls become
parameter-carrying and pass the deployed tool's input
validation, un-breaking the path against the current replicator.
Against older replicator binaries the added parameters are
ignored (unknown JSON fields), so no deployment is broken by the
template side. No plugin, tool, or dependency changes; no gate,
threshold, severity, or pinned-version changes (the pack version
bump is additive bookkeeping on a repo-local governance pack,
and DE-008's MUST/CRITICAL classification is unchanged).

**Sequencing**: this change's MODIFIED spec deltas build on the
requirements the `delegation-skill-enforcement` change defined;
that change is complete (16/16 tasks) but not yet archived, so
it MUST archive before this change does. Its PR landing first is
the natural order and requires no coordination beyond normal
queueing.

**Content coverage**: blog assessed yes -- covered by the
epic-level blog tracker (#742) rather than a new post unless
reassessment at filing (task 4.2) says otherwise; tutorial
assessed no (developer-facing tooling-contract change, the
same rationale as the parent change).

**Out of scope** (no change): the replicator tool itself
(unbound-force/replicator#143, shipped); `forge.md`,
`coordinator.md`, `worker.md`, and the forge skills (already
synced by commit 19ca1d6); the `uf_delegate_command` contract
and its call blocks; command-path Steps 2/3 delegations.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

The Swarm path's delegation contract moves from prose embedded
in a spawned subtask description (unvalidated, prompt-coupled)
to tool parameters with fail-closed validation and durable
records. Collaboration on that path now happens through the
well-defined parameter artifact -- the same contract
`uf_delegate_command` already uses -- instead of
description-prose conventions.

### II. Composability First

**Assessment**: PASS

The template update is forward-compatible: older replicator
binaries ignore the added parameters (`json.Unmarshal` unknown
fields), so hero repos and deployments that have not synced
keep functioning. No mandatory dependency is introduced; the
spawn tool remains optional (its absence still falls back to
sequential `uf_delegate_command` execution).

### III. Observable Quality

**Assessment**: PASS

The spawn tool's validated parameters and failure envelopes
(`SKILL_REFERENCE_REQUIRED`, `SKILL_NOT_FOUND`) are
machine-parseable outputs with provenance; the template names
the envelope codes so failures are greppable at the point of
instruction. The classification and reference travel as
structured parameters, auditable without prompt archaeology.

### IV. Testability

**Assessment**: PASS

The change is verified by the existing byte-identity drift
tests (canonical command vs scaffold mirror) plus content pin
tests over the embedded assets -- all runnable in isolation via
the Go test suite with no external services. The replicator
tool's own contract validation is tested in its repo
(unbound-force/replicator#143) and referenced, not duplicated.

### V. Security by Default

**Assessment**: PASS

No security surface is touched: no dependencies, permissions,
input handling, or supply-chain artifacts change. The spawn call
block names an already-deployed tool's input schema, and the
forwarded parameters are ignored by older binaries, so no new
trust boundary is introduced; no gate, severity, or
pinned-version change rides along.

### VI. Deterministic Execution

**Assessment**: PASS

This change is Principle VI applied to the Swarm path's carrier:
the delegation classification moves from re-reasoned description
prose to fail-closed tool parameters with durable audit records,
and the governance wording (DE-008, the Guard checklist, the
determinism-first skill) is corrected to point at the parameter
contracts as the mechanism of record.

## Task 4.2 Documentation Gate Record

Recorded 2026-10-25, task 4.2 (documentation gate).

**CHANGELOG**: entry added under Unreleased → Changed
(newest first) as `spawn-subtask-classification-params`,
covering the spawn call block parameterization (with the
fail-closed envelope behavior and the older-binary
forward-compatibility note), the byte-identical scaffold
mirror, DE-008's reworded Swarm-path clause with the
1.3.0 -> 1.4.0 pack bump (MUST/CRITICAL mapping unchanged),
the Guard checklist's spawn-parameter audit, the
determinism-first skill update, and the scaffold test pins
(Fixes: #830, Refs: unbound-force/replicator#143).

**AGENTS.md / README.md / docs/ dispositions** (assessed, no
edits made): AGENTS.md -- not applicable (no build-command,
project-structure, or convention change; the Convention Packs
listing carries no pack versions, so the 1.3.0 -> 1.4.0 bump
needs no edit; the Determinism-gate behavioral rule's
substance is unchanged -- the pack wording strengthened the
rule's carrier, nothing weakened). README.md -- not
applicable (no description-level change). docs/ -- no file
references the changed surfaces (grep over docs/ for
`forge_spawn_subtask`, `task_classification`,
`determinism-first`, and `Deterministic Delegation` returns
nothing), so no statement is now false; the residual
usage.md/heroes.md parity decisions are tracked by the filed
issue below, and docs/architecture.md's pre-existing
pack-listing gap stays with #791 (not caused or widened by
this diff, not duplicated).

**Issue check (before filing)**: #791 OPEN (parent change's
docs-gate issue -- `uf_delegate_command` contract scope; its
usage.md/heroes.md dispositions are the parent's, not
duplicated), #742 OPEN (epic-level blog tracker for the
`/uf.unleash` deterministic-tools epic),
unbound-force/website#317 OPEN (website-side user-facing
documentation of the delegation classification contract).
This repo's open issues searched for spawn-subtask
classification coverage -- none found beyond #830 (the
originating issue, not a docs issue).

**Blog/tutorial reassessment at filing**: blog -- covered by
#742 (this change's candidate story, the Swarm path's carrier
graduating from description prose to the spawn tool's
fail-closed parameters, falls under the epic tracker; no new
post filed); tutorial -- no (developer-facing tooling
contract, documented via the CHANGELOG entry and the command
template).

**Filed**: unbound-force/unbound-force#834
(https://github.com/unbound-force/unbound-force/issues/834,
labeled `documentation`, assigned jflowers) -- this change's
documentation-gate record: the CHANGELOG entry, the per-file
dispositions, the residual usage.md/heroes.md parity
decisions, and the website-coverage note. The constitution
Cross-Repo Documentation need is covered by
unbound-force/website#317 (this change extends the same
contract to the second delegation tool rather than adding a
documentation surface; the spawn-tool parity folds into #317's
scope, noted in #834 rather than duplicated as a new website
issue).

Task 4.3 (constitution-alignment verification) remains to be
recorded by that task.

## Task 4.3 Constitution Alignment Record

Recorded 2026-10-25, task 4.3 (constitution-alignment
verification). Re-verified against the final committed diff
(`19ca1d6..HEAD`, HEAD `7c61149`); the working tree's tasks.md
checkbox edits are out of scope — committed content only.

**Constitution source**: verified against
`.specify/memory/constitution.md` — v1.4.0, six principles,
Last Amended 2026-10-14. Note: `.uf/constitution/` does not
exist in this repository; `.specify/memory/constitution.md` is
the location the constitution's own Hero Constitution
Alignment section designates, and its version, principles, and
amendment dates match the described org constitution exactly.

**I. Autonomous Collaboration**: PASS — assessment holds. The
committed uf.unleash.md diff replaces the description-carrier
prose (the deleted "The spawn tool has no classification
parameters, so the description is the contract's carrier on
this path") with a fenced, parameterized spawn call block, and
the classification step's cross-reference now names the spawn
tool's `task_classification` parameter. The delegation
contract travels as structured, schema-validated tool
parameters with durable records — a well-defined artifact on
both delegation paths — rather than prompt-coupled prose.

**II. Composability First**: PASS — assessment holds. No
dependency is introduced (the diff touches no go.mod, package
manifest, or tool registration), the spawn tool remains
optional (the Swarm-unavailable fallback to sequential
`uf_delegate_command` execution is untouched by the diff), and
the template change is forward-compatible with older
replicator binaries (unknown JSON fields are ignored), while
the old prose-only calls were already failing the deployed
tool's required-`task_classification` input validation — the
break this change fixes.

**III. Observable Quality**: PASS — assessment holds. The
template names the machine-parseable failure envelopes
(`SKILL_REFERENCE_REQUIRED`, `SKILL_NOT_FOUND`, and the
input-validation failures) at the point of instruction; the
classification, resolved reference, and reason are
tool-recorded, and that record — not prompt archaeology — is
the audit source; the Guard checklist now audits call
parameters instead of prompt prose.

**IV. Testability**: PASS — assessment holds, re-verified by
execution. `internal/scaffold/scaffold_test.go` is +495/-0
(pure additions; no existing test removed or weakened): the
three-layer seam test (registration surface, documented output
shape, round trips) plus Guard, pack, and skill pins. `go
test -race -count=1 ./internal/scaffold/` passes, and direct
`cmp` confirms both scaffold mirrors are byte-identical to
their canonicals. No external services are required; the
replicator-side contract validation is tested in its own repo
and referenced, not duplicated.

**V. Security by Default**: PASS — assessment holds. No
dependency, permission, CI, or supply-chain surface appears in
the diff (no go.mod, .github/, opencode.json, or coverage
config among the changed files). The change strengthens input
hygiene on the Swarm path — fail-closed schema validation
before any child session spawns. No gate, severity, or
pinned-version change rides along (verified below).

**VI. Deterministic Execution**: PASS — assessment holds. The
change is Principle VI applied to the Swarm path's carrier:
the delegation classification moves from re-reasoned
description prose to fail-closed tool parameters with durable
audit records, and DE-008, the Guard checklist, and the
determinism-first skill now name the parameter contracts as
the mechanism of record. Delivery follows the pack's own
rules: DE-007 seam verification in the same increment, a
pinnable fenced call-block shape, and design-recorded
template sites.

**Gatekeeping integrity**: PASS. DE-008 keeps its [MUST]
classification (the diff shows `- **DE-008** [MUST]` on both
sides), and the pack's severity-mapping paragraph is
unchanged — DE-008 remains in the [MUST] set mapped to
CRITICAL findings. The determinism.md diff is exactly two
hunks (the 1.3.0 -> 1.4.0 frontmatter bump and the DE-008
rule bullet); DE-001 through DE-007 and both severity
paragraphs are byte-unchanged. The rule is strengthened, not
weakened: the Swarm-path MUST obligation is identical in
substance, its carrier moves from the unvalidated spawned
description to fail-closed validated parameters, and
enforcement widens to both delegation tools; the dropped "in
checkpoint data and the success envelope" phrase generalizes
the record location across two tools with different record
surfaces (the Guard diff correspondingly scopes that claim to
`uf_delegate_command`), with the audit-source requirement
retained. The version bump is additive bookkeeping — pack
metadata documenting the reworded carrier, not a gate value —
and a pin test now asserts it. No gate value is touched
anywhere in the diff: no coverage floor (coverage-gate.json,
vitest.config.ts), CRAP score, CI flag (.github/workflows),
review limit (review-matrix.yaml), pinned dependency (go.mod),
or agent setting; a keyword scan of the full diff returns only
test-pin comments and this change's own no-weakening
assertions. scaffold_test.go adds tests only, and the
knownNonEmbeddedFiles entries covering the repo-local
determinism files predate this change (present at 19ca1d6),
so no self-serving drift exemption was introduced.

**Overall verdict**: all six principles PASS against the
final committed diff, and the proposal's Constitution
Alignment assessments (I-VI, PASS each) are confirmed accurate
with no corrections needed. Gatekeeping integrity confirmed:
the pack version bump is additive bookkeeping, DE-008's
MUST/CRITICAL classification and every pre-existing rule,
severity, and threshold are unchanged, and no gate is
weakened, bypassed, or disabled. The change is
constitution-compliant.

<!-- scaffolded by uf vdev -->
