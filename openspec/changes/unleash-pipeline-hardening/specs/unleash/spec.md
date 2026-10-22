## MODIFIED Requirements

### Requirement: Command delegation tool

`uf_delegate_command` resolves the child model from the parent
session's current assistant message. When that message carries
no valid `variant` field (a provider that does not populate
variants), resolution MUST fall back to spawning the child
without a variant override rather than failing. When host-model
resolution fails for a structural reason (no resolvable model
or variant), the resulting error envelope MUST be classified
non-retryable and MUST name the remediation; only transient
causes MAY be classified retryable.

Previously: the tool read the command file, composed the
prompt, spawned the child session, verified the expected
artifact, and checkpointed -- with no specified behavior for a
parent assistant message lacking a variant field, and
HOST_MODEL_UNAVAILABLE classified retryable unconditionally.

#### Scenario: Provider populates no variant field

- **GIVEN** the parent session's current assistant message
  carries model identity but no `variant` field
- **WHEN** `uf_delegate_command` resolves the host model
- **THEN** the child session spawns without a variant override
  and the delegation proceeds

#### Scenario: Structural resolution failure

- **GIVEN** host-model resolution fails because no model can be
  resolved from the parent session at all
- **WHEN** the error envelope is returned
- **THEN** it is classified non-retryable and includes the
  remediation (configure or pass an explicit model)

### Requirement: Route decision tool

Before recording a tier decision, the route decision tool MUST
validate that the chosen tier's entry commands exist on disk
(speckit: the speckit specify command; openspec: the
opsx-propose command). When an entry command is missing, the
tool MUST return a validation error naming the missing paths
and the tiers whose entry commands do exist, and MUST NOT
record the decision.

Previously: the tool validated risk floors, branch state, and
tree cleanliness, and recorded the decision with no check that
the selected tier's downstream commands are installed.

#### Scenario: Speckit entry command not scaffolded

- **GIVEN** the rubric selects the speckit tier and
  `.opencode/commands/speckit.specify.md` does not exist, while
  `opsx-propose.md` does
- **WHEN** the route decision tool is invoked
- **THEN** it returns a validation error naming the missing
  speckit command and the available openspec entry point, and
  records no decision

### Requirement: Tool-rendered exit and demo output

`format_unleash_exit` MUST support variants for tier-routing
failures (dirty tree after route analysis, missing tier entry
commands) and for planner failures (review dispatch planning
returned errors), so that the command's "never improvise exit
text" guardrail is satisfiable on every stop path. The command
template MUST NOT contain hand-composed exit prose for paths a
variant covers.

Previously: variants existed for clarify, spec-review, and the
implement/code-review failure paths; tier-routing and planner
failures had no variant and their exit text was improvised.

#### Scenario: Tier routing stops on missing entry command

- **GIVEN** the route decision tool returned a validation error
  for the selected tier's missing entry commands
- **WHEN** the command exits at tier routing
- **THEN** the exit text is rendered by `format_unleash_exit`
  with a tier-routing variant, not composed by the agent

### Requirement: Unleash summary artifact

Exactly one summary tool MUST be registered. If both a writing
and a persisting name exist, the redundant registration MUST
be removed (or reduced to a single alias) so tool listings
show one canonical entry.

Previously: `write_unleash_summary` and
`persist_unleash_summary` were both registered with overlapping
behavior.

#### Scenario: Tool listing shows one summary tool

- **GIVEN** the plugin tools are enumerated
- **WHEN** searching for unleash summary tools
- **THEN** exactly one canonical tool name appears

### Requirement: Checkpoint auto-recording

The checkpoint tool MUST remain the durable record of pipeline
progress: step-level checkpoints for each workflow step, plus
phase-scoped checkpoints (e.g. `implement-phase-4`) recorded
after each green phase checkpoint. TodoWrite tracking is
RECOMMENDED as a display aid but MUST NOT be specified as a
co-maintained record of truth in the command template.

Previously: the template required both the checkpoint tool and
TodoWrite to be maintained in parallel ("both MUST be
maintained"), which was observed under-maintained (7 of ~22
required updates) and duplicated state.

#### Scenario: Phase checkpoint recorded durably

- **GIVEN** the Phase 4 pre-flight checkpoint passes
- **WHEN** the pipeline records progress
- **THEN** a phase-scoped checkpoint exists that a later
  `get_progress` call returns with the pass verdict and failure
  classification inventory

## ADDED Requirements

### Requirement: Post-compaction re-anchoring

After any context compression event, the pipeline MUST
re-anchor before proceeding: call `parse_tasks` on the active
tasks.md and `get_progress` for durable state, and treat those
results -- not compression summaries -- as authoritative. The
pipeline MUST NOT re-run a phase checkpoint whose phase-scoped
checkpoint is already recorded green, and MUST NOT re-verify
work products whose tasks are marked complete. The command
template MUST express this as the re-anchor procedure,
replacing the instruction to re-read the entire command
template.

#### Scenario: Compression between phases

- **GIVEN** Phase 4 is complete, its checkpoint recorded green,
  and tasks.md shows 12 of 16 tasks done, and a compression
  event occurs
- **WHEN** the pipeline resumes
- **THEN** it calls `parse_tasks` and `get_progress`, observes
  the durable state, and begins Phase 5 without re-running the
  Phase 4 checkpoint or re-verifying Phase 4 artifacts

#### Scenario: Compression summary contradicts durable state

- **GIVEN** a compression summary implies a phase checkpoint
  still needs verification while the phase-scoped checkpoint is
  recorded green
- **WHEN** the pipeline resumes
- **THEN** the durable checkpoint wins and no re-run occurs

### Requirement: Phase checkpoint durability

Each phase pre-flight checkpoint MUST produce a durable record
containing the verdict and the classified failure inventory
(pre-existing, environmental, or change-caused). When a later
phase classifies failures, it MUST compare against the recorded
inventory first; a new baseline worktree MUST only be built
when a failure does not match any recorded classification.

#### Scenario: Known environmental failure recurs

- **GIVEN** Phase 1 classified a macOS-only TLS failure as
  environmental at clean HEAD and recorded it
- **WHEN** Phase 5 hits the same failure signature
- **THEN** the pipeline matches it against the recorded
  inventory and does not build a new baseline worktree

### Requirement: Mechanical task tool references

When a task in tasks.md describes a mechanical procedure for
which a repo skill or script exists, the implement phase MUST
execute that skill or script (or record in the task's
completion summary why it was not used). The command template's
implement guidance MUST instruct this, and the task delegation
prompt MUST pass the skill or script reference through to the
child.

#### Scenario: ADR renumber with repo skill present

- **GIVEN** a task requires renumbering an ADR and the repo
  ships a renumber-adr skill with an in-flight-claims script
- **WHEN** the task is delegated
- **THEN** the delegation names the skill, and the child runs
  its full procedure including the in-flight-claims step

### Requirement: Template tool-name accuracy

The command template MUST reference plugin and MCP tools by
their registered names (including provider prefixes where the
runtime applies them, e.g. `replicator_forge_worktree_list`),
not by abbreviated or aspirational names. A tool-name audit
MUST accompany any change that renames or registers tools.

#### Scenario: Worktree listing referenced correctly

- **GIVEN** the command template instructs a worktree status
  check
- **WHEN** the agent executes it
- **THEN** the template names the registered tool exactly, with
  no name-guessing required
