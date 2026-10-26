## Context

The `delegation-skill-enforcement` change (#787) gave
`uf_delegate_command` a parameter-level delegation contract --
`task_classification`, an existence-verified `skill` reference,
and `skill_absent_reason`, enforced fail-closed before any child
session spawns -- and recorded the Swarm parallel path's posture
in the `/uf.unleash` template: the spawn tool had no
classification parameters, so the subtask description carried the
contract, and tool-level validation on that path was a design
Non-Goal tracked by unbound-force/replicator#143.

unbound-force/replicator#143 shipped. The deployed
`replicator_forge_spawn_subtask` tool now requires
`task_classification`, accepts `skill` /
`skill_absent_reason` under the same cross-field rules, and
fails closed with `SKILL_REFERENCE_REQUIRED` / `SKILL_NOT_FOUND`
before the subtask spawns. This repo's replicator coordination
surface synced in commit 19ca1d6 (2026-10-25: `forge.md`,
`coordinator.md`, `worker.md`, `background-worker.md`, and the
forge skills -- all now pass the parameters and forward the
envelope's `skill_directive` verbatim).

The `/uf.unleash` Swarm path is the remaining consumer, and its
template text is now false ("The spawn tool has no
classification parameters") and actively broken (un-parameterized
spawn calls fail the deployed tool's required-parameter
validation at spawn time). This change is the consumer-side
closure issue #830 tracks.

Constitution alignment is assessed per principle in proposal.md;
this design is Principle VI applied to the Swarm path's carrier
(an existing rule whose mechanism of record arrives), with
Principle III shaping the named envelope codes and Principle II
shaping the forward-compatibility guarantee.

## Goals / Non-Goals

### Goals

- The Swarm parallel path's spawn calls pass
  `task_classification` and, for deterministic tasks, the
  verified `skill` reference or `skill_absent_reason` as
  `replicator_forge_spawn_subtask` parameters, in a call block
  mirroring the `uf_delegate_command` call blocks -- the path
  works against the deployed replicator again.
- Every statement in the repo that asserts the spawn tool lacks
  a parameter contract, or that names the subtask description as
  the carrier, is corrected or deleted -- template (both
  copies), DE-008, the Guard checklist (both copies), and the
  determinism-first skill.
- The skill directive reaches workers tool-rendered: the spawn
  envelope's `skill_directive` is forwarded verbatim, never
  authored in prose (mirroring the already-synced forge
  surfaces and `uf_delegate_command`'s D3 precedent).
- Older replicator binaries keep working against the updated
  template (unknown JSON fields are ignored) -- zero new
  deployment requirements.
- The governance wording stays citable and checked: DE-008
  (pack v1.4.0) names both tools' contracts; the Guard audits
  spawn parameters, not prompt prose.

### Non-Goals

- No replicator tool changes (unbound-force/replicator#143,
  shipped; its validation semantics are referenced, not
  re-specified or duplicated here).
- No changes to `forge.md`, `coordinator.md`, `worker.md`,
  `background-worker.md`, or the forge skills -- already synced
  by commit 19ca1d6.
- No changes to the `uf_delegate_command` contract or its three
  call shapes in the template (quick-tier whole-change, per-task,
  code-fix) -- those landed with the parent change.
- No changes to command-path Steps 2/3 delegations (the command
  file is the procedure of record).
- No plugin, tool registration, schema, or dependency changes;
  no AGENTS.md behavioral-rule change (the existing
  "Determinism gate" rule remains accurate without amendment).
- No enforcement or audit work in this repo for the spawn
  tool's internals (checkpoint records, envelope fields) --
  Replicator-owned and Replicator-tested.

## Decisions

### D1: The spawn call becomes a fenced parameter block
mirroring `uf_delegate_command`

The parallel-execution item 3c prose ("Call
`replicator_forge_spawn_subtask` with the task description,
files from the task, and the worktree path. The subtask
description MUST carry ... The spawn tool has no classification
parameters, so the description is the contract's carrier on
this path.") is replaced by a call block in the same shape as
the per-task `uf_delegate_command` block:

    - Call `replicator_forge_spawn_subtask` with the task
      description, files from the task, the worktree path, and
      the delegation parameters:

      ```
      replicator_forge_spawn_subtask
        subtask_description: [the task description exactly as
          parsed]
        task_classification: [the task's classification --
          deterministic or judgment, per the step above]
        skill: [repo skill or script reference that performs
          the task end-to-end -- only when deterministic]
        skill_absent_reason: [what was searched and what was
          found -- only when deterministic and no repo skill or
          script applies; never together with skill]
        files: [files from the task]
        project_path: [the worktree path]
      ```

      The spawn tool enforces the same parameter contract as
      `uf_delegate_command`, fail-closed before the subtask
      spawns: a call omitting `task_classification` fails input
      validation, a deterministic call supplying neither `skill`
      nor `skill_absent_reason` fails with
      `SKILL_REFERENCE_REQUIRED`, an unresolvable reference fails
      with `SKILL_NOT_FOUND`, and a judgment-classified call
      supplying either skill field fails input validation. When
      the spawn envelope carries a `skill_directive`, forward it
      verbatim into the worker's prompt -- never author skill
      instructions in prose.

The classification step's closing cross-reference ("Swarm-path
`[P]` delegations carry the same classification through the
spawned subtask description (see parallel execution below)")
changes to name the spawn parameters ("...through the spawn
tool's `task_classification` parameter (see parallel execution
below)"). These are the only two template sites that carry the
description-carrier wording (grep-verified: lines 909 and 1088
of the current template).

Alternatives rejected:

- **Keep prose, add parameters informally.** A prose sentence
  ("also pass task_classification") has no call-block shape to
  pin in tests and drifts immediately; the fenced block is the
  established, pinnable pattern.
- **Enumerate every spawn-tool parameter (bead_id, epic_id,
  subtask_title, shared_context).** The current template names
  only description, files, and worktree path; enumerating the
  full tool schema here would duplicate Replicator's
  registration surface and rot on the next tool change. Scope:
  the delegation parameters this change exists to pass, plus
  the fields the template already names.

### D2: Scaffold mirrors update byte-identically, pins extend

`internal/scaffold/assets/opencode/commands/uf.unleash.md` and
`.../agents/divisor-guard.md` are embedded mirrors; both change
in the same increment with the byte-identity drift tests green
(the parent change's D7 precedent). The determinism pack and
the determinism-first skill are repo-local
(`knownNonEmbeddedFiles`) and need no mirrors.

The existing scaffold pin ("implement parallel workers route
through the forge worktree tools") asserts the spawn invocation
carries "files from the task"; it extends to assert
`task_classification:` appears in the parallel-execution spawn
guidance and that the stale sentence ("The spawn tool has no
classification parameters") is absent from both the canonical
command and the mirror. A pin on the Guard agent asserts the
checklist's Swarm-path item names the spawn parameters and no
longer contains "has no parameter contract of its own". Pins
read the embedded assets (and, where the existing pattern does
so, the canonical `.opencode/` sources), so they verify in
isolation with no external services (Constitution IV).

### D3: DE-008 names both tools' contracts; pack 1.3.0 → 1.4.0

DE-008's Swarm-path clause changes from "MUST carry ... in the
spawned subtask description" to "MUST pass ... as spawn-tool
parameters", and the rule's contract list extends from
`uf_delegate_command` to both delegation tools. The failure-code
sentence ("The tool enforces ...") becomes "Both tools enforce
...". The severity mapping is unchanged: DE-008 remains in the
MUST/CRITICAL list.

The pack version bumps 1.3.0 → 1.4.0, MINOR. The parent's bump
precedent (1.2.0 → 1.3.0) was MINOR for a new rule; this
change alters an existing rule's normative carrier -- what
compliance means on the Swarm path changes from
description-prose to parameters -- which is more than an
editorial PATCH and adds no removal. MINOR with the rationale
recorded in the spec delta.

Alternative rejected: PATCH (1.3.1) on the theory that wording
clarifications are fixes. The old behavior (description
carrier) becomes non-compliant, so the rule's requirements
changed; PATCH would understate the delta to reviewers citing
the pack.

### D4: The Guard checklist audits parameters, not prompts

The Deterministic Delegation Discipline section's Swarm-path
item currently reads "...through the forge subtask tool, which
has no parameter contract of its own -- omit the task
classification...?" and audits the spawn prompt. It changes to
audit the spawn call's `task_classification`, `skill`, and
`skill_absent_reason` parameters and to state that the spawn
tool enforces the same fail-closed contract as
`uf_delegate_command`. The section intro ("through the command
delegation tool's parameter contract") widens to "through the
delegation tools' parameter contracts". The self-describing
constraint is preserved: the agent definition names the
contracts and cites no repo-local pack rule (it is
scaffold-embedded; the pack is repo-local).

### D5: The determinism-first skill makes the same correction

The skill's sentence "Swarm-path spawn prompts for deterministic
`[P]` tasks carry the classification and the verified reference
(or recorded reason) in the subtask description" changes to name
the spawn tool's parameters. The Related Enforcement section's
`uf_delegate_command` parameter contract entry widens in the
same edit to name both delegation tools' contracts, satisfying
the spec delta's plural reference. The issue's requested-change
list names DE-008 and the Guard checklist; the skill is included
because it carries the identical stale sentence from the same
parent-change layer set (parent design D6 wired four layers:
pack, Guard, skill, template), and leaving it stale would
reproduce exactly the problem this change exists to close. The
edit is one sentence plus one Related Enforcement entry in a
repo-local file.

### D6: Compatibility and sequencing are asymmetric by design

- Updated template + older replicator: no-op pass-through. The
  added parameters are unknown JSON fields, which Go's
  `json.Unmarshal` ignores; the spawn proceeds with its
  pre-#143 semantics.
- Old template + #143 replicator: broken. `task_classification`
  is schema-required and fail-closed, so prose-only spawn calls
  fail input validation -- the active regression this change
  closes.

Therefore the template update is safe to land in any replicator
deployment state, and delaying it only extends the broken
window. The replicator rollout is already underway (the
coordination surface synced 2026-10-25), so this change lands
with the rollout rather than before it -- the issue's
"alongside (or before)" condition is satisfied by landing now.
No coordination beyond normal review queueing is required.

### D7: Spec deltas stack on the parent change

The MODIFIED deltas (`Mechanical task tool references`,
DE-008, the pack version bump, the skill guidance, the Guard
enforcement requirement) modify requirements the
`delegation-skill-enforcement` change defined. That change is
complete (16/16 tasks) but not yet archived; it MUST archive
before this change so the mainline specs contain the
requirements these deltas modify. Natural PR ordering (parent
first) satisfies this; no rebase or artifact surgery is needed.
The new ADDED requirement (change record) has no such
dependency.

## Risks / Trade-offs

- **Template names another repo's tool contract.** The call
  block and envelope codes document
  `replicator_forge_spawn_subtask`'s schema, which Replicator
  owns. Mitigated: the template already names the tool and its
  worktree lifecycle, the parameter names are stable
  (mirroring `uf_delegate_command`'s contract by design), and
  the pin tests make drift visible on the next sync. Accepted.
- **Mirror lag in hero repos.** Hero repos receive the template
  via `uf init` sync; unsynced repos keep the stale text and
  the broken spawn calls against a new replicator. This is the
  existing sync model (parent change's "Downstream lag" risk);
  `uf init` closes it mechanically. Accepted.
- **Stale-pin risk in tests.** Pins assert exact phrases ("files
  from the task", `task_classification:`), so future template
  rewording breaks tests. That is the pins doing their job
  (drift is surfaced, not silent); the phrases chosen are the
  contract-bearing ones. Accepted.
- **MINOR-vs-PACK version debate.** A reviewer may read the
  pack bump as PATCH-worthy. The spec delta records the
  rationale (normative carrier change); the bump direction is
  strengthening, and gatekeeping integrity is preserved (no
  rule, severity, or threshold weakened). Accepted.
