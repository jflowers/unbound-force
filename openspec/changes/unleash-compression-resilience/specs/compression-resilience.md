## ADDED Requirements

### Requirement: Session-Resume Guard (FR-001)

The `/uf.unleash` command template MUST include a session-resume
guard blockquote at the beginning of the Instructions section,
before Step 0 (Startup Cleanup). The guard MUST instruct the agent
to:

1. Re-read the full template on session resume
2. NOT infer step completion from compressed context summaries
3. Treat only filesystem markers as authoritative for resumability
4. Maintain the execution checklist using the Edit tool

#### Scenario: Compression fires mid-pipeline
- **GIVEN** the agent is executing Step 5 (Implement) Phase 2
- **WHEN** context compression fires and discards procedural
  instructions from earlier in the conversation
- **THEN** the session-resume guard remains visible in the
  compressed context and the agent re-reads the template to
  recover step-by-step instructions

#### Scenario: Agent resumes after re-run
- **GIVEN** the agent is re-invoked with `/uf.unleash` after a
  previous session was interrupted
- **WHEN** the agent reads the session-resume guard
- **THEN** the agent probes filesystem markers per Step 2
  (Resumability Detection) and does NOT rely on any prior
  conversation state

### Requirement: Execution Checklist (FR-002)

The `/uf.unleash` command template MUST include an execution
checklist immediately after the session-resume guard. The checklist
MUST track:

- Current pipeline step (0-8) with step name
- Current phase within Step 5 (Phase N/M)
- Fix loop iteration count for Step 4 and Step 6 (iteration N/3)
- Parallel worker batch progress for Step 5 (batch N/M,
  workers completed/total)

The agent MUST update the checklist in-place using the Edit tool
as each step, phase, or iteration completes.

#### Scenario: Agent updates checklist after completing Step 4
- **GIVEN** the agent has completed Step 4 (Spec Review)
  with all reviewers approving
- **WHEN** the agent prepares to proceed to Step 5 (Implement)
- **THEN** the agent uses the Edit tool to mark Step 4 as
  complete in the execution checklist before proceeding

#### Scenario: Agent tracks fix loop iteration
- **GIVEN** the agent is in Step 6 (Code Review) and findings
  were returned on the first iteration
- **WHEN** the agent begins the second fix-and-review iteration
- **THEN** the agent uses the Edit tool to update the checklist
  to show "iteration 2/3" for Step 6

#### Scenario: Agent tracks parallel worker batch
- **GIVEN** Step 5 has 6 parallel tasks, batched as 4 + 2
- **WHEN** the first batch of 4 workers completes
- **THEN** the agent uses the Edit tool to update the checklist
  to show "batch 2/2, 0/2 workers done" before spawning the
  second batch

### Requirement: Step-Level Checkpoint Reminders (FR-003)

Each step in the `/uf.unleash` command template MUST end with a
checkpoint reminder instructing the agent to update the execution
checklist. The reminders MUST use blockquote format:

- Step boundaries: `> CHECKPOINT: Mark Step N complete in the
  execution checklist before proceeding.`
- Phase boundaries (Step 5): `> CHECKPOINT: Update execution
  checklist -- Phase N/M complete.`
- Fix loop iterations (Steps 4, 6): `> CHECKPOINT: Update
  execution checklist -- iteration N/3.`

#### Scenario: Agent completes Step 3 (Tasks)
- **GIVEN** the agent has generated tasks.md in the feature
  directory
- **WHEN** the agent reaches the end of Step 3 instructions
- **THEN** the agent encounters the checkpoint reminder and
  updates the execution checklist to mark Step 3 complete

#### Scenario: Agent completes a phase in Step 5
- **GIVEN** the agent has completed all tasks in Phase 2 of 3
  and the pre-flight hard-gate has passed
- **WHEN** the agent reaches the phase checkpoint reminder
- **THEN** the agent updates the execution checklist to show
  "Phase 2/3 complete" before proceeding to Phase 3

### Requirement: Filesystem Markers Remain Authoritative (FR-004)

The execution checklist MUST NOT replace filesystem markers as the
authoritative source for resumability detection. On re-run, the
agent MUST re-probe filesystem markers per Step 2 regardless of
execution checklist state.

Authoritative filesystem markers:
- Task checkboxes (`[x]` vs `[ ]`) in `tasks.md`
- `<!-- spec-review: passed -->` HTML comment in `tasks.md`
- `<!-- code-review: passed -->` HTML comment in `tasks.md`

#### Scenario: Checklist disagrees with filesystem
- **GIVEN** the execution checklist shows Step 5 as complete
  but `tasks.md` contains unchecked `[ ]` task checkboxes
- **WHEN** the agent runs Step 2 (Resumability Detection)
- **THEN** the agent treats Step 5 as incomplete based on
  filesystem markers, ignoring the execution checklist

### Requirement: Scaffold Copy Sync (FR-005)

The scaffold copy at
`internal/scaffold/assets/opencode/commands/uf.unleash.md`
MUST be updated to match the canonical copy at
`.opencode/commands/uf.unleash.md`. Existing drift detection
tests MUST continue to pass.

#### Scenario: Drift detection after update
- **GIVEN** both files have been updated with identical content
- **WHEN** drift detection tests run
- **THEN** all tests pass, confirming the files are in sync

## MODIFIED Requirements

### Requirement: Step 2 Resumability Detection

Step 2 MUST explicitly state that only filesystem markers are
authoritative for resumability. Previously, this was implicit.
The modification adds a sentence clarifying that compressed
context summaries are NOT valid resumability indicators.

Previously: Step 2 listed filesystem markers to check but did
not explicitly warn against using compressed context.

## REMOVED Requirements

None.
