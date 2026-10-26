## MODIFIED Requirements

### Requirement: Mechanical task tool references

The implement phase MUST classify each delegated task as
deterministic or judgment before delegation and pass the
classification through `uf_delegate_command`'s
`task_classification` parameter. Deterministic tasks MUST pass a
verified `skill` reference or a `skill_absent_reason`; the tool
enforces this contract. The command template's implement guidance
MUST present a self-describing classification step and the
parameter contract (not prose-only skill instructions, and no
citation of repo-local guidance artifacts -- the template is
scaffold-embedded), the code-fix delegation calls MUST declare
`task_classification` derived from the nature of the fix
(deterministic with a verified skill or script reference when a
repo tool performs the fix end-to-end; judgment for
prose-finding application), the quick-tier whole-change
delegation MUST declare the classification derived from the
nature of the work, and Swarm-path parallel delegations (`[P]`
tasks spawned through the forge subtask tool) MUST pass the task
classification -- and, for deterministic tasks, the verified
skill or script reference or recorded absence reason -- as
`replicator_forge_spawn_subtask` parameters, in a call block
mirroring the `uf_delegate_command` call blocks. The spawn tool
enforces the same fail-closed contract before the subtask
spawns: a call omitting `task_classification` fails input
validation, a deterministic call supplying neither `skill` nor
`skill_absent_reason` fails with `SKILL_REFERENCE_REQUIRED`, an
unresolvable reference fails with `SKILL_NOT_FOUND`, and a
judgment-classified call supplying either skill field fails
input validation. When the spawn envelope carries a
`skill_directive`, the caller MUST forward it verbatim into the
worker's prompt and MUST NOT author skill instructions in prose.
The template MUST NOT assert that the spawn tool lacks
classification parameters, and MUST NOT instruct the spawned
subtask description to carry the classification contract.

Previously: Swarm-path parallel delegations carried the task
classification and, for deterministic tasks, the verified skill
or script reference or recorded absence reason in the spawned
subtask description, because the spawn tool had no
classification parameters.

#### Scenario: Mechanical task with repo skill present

- **GIVEN** a task requires executing the repo's CI-parity
  pre-flight procedure and the repo ships the pre-flight skill
- **WHEN** the task is delegated
- **THEN** the delegation is classified deterministic, names
  the skill, and the child runs the skill's full procedure

#### Scenario: Mechanical task with no repo skill

- **GIVEN** a task describes a mechanical procedure for which
  no repo skill or script exists
- **WHEN** the task is delegated
- **THEN** the delegation is classified deterministic with a
  `skill_absent_reason`, and the recorded reason is auditable
  in the checkpoint data

#### Scenario: Swarm-path parallel task carries the reference

- **GIVEN** a deterministic `[P]` task is delegated through the
  Swarm parallel path (forge subtask spawn)
- **WHEN** the spawn call is composed
- **THEN** it passes `task_classification: "deterministic"` and
  the verified skill or script reference (or the recorded
  absence reason) as spawn parameters, the spawn tool validates
  them before the subtask spawns, and any returned
  `skill_directive` is forwarded into the worker's prompt
  verbatim

#### Scenario: Swarm-path judgment task spawns without skill
fields

- **GIVEN** a judgment `[P]` task is delegated through the
  Swarm parallel path
- **WHEN** the spawn call is composed
- **THEN** it passes `task_classification: "judgment"`, omits
  both skill fields, and the spawn proceeds

#### Scenario: Judgment task delegated without skill

- **GIVEN** a task requires evaluating two design approaches
- **WHEN** the task is delegated
- **THEN** the delegation is classified judgment and proceeds
  without a skill reference and without a failure

#### Scenario: Template stays compatible with older spawn tools

- **GIVEN** the updated template runs against a replicator
  binary whose spawn tool predates the classification parameters
- **WHEN** the spawn call carries the additional parameters
- **THEN** the older tool ignores the unknown fields and the
  spawn proceeds unchanged
