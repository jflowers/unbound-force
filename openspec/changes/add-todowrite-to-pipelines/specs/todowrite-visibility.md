## ADDED Requirements

### FR-001: Pipeline TodoWrite initialization

Every pipeline command that uses an embedded execution checklist
MUST instruct the agent to initialize a TodoWrite list at pipeline
start. The TodoWrite items MUST correspond 1:1 with the execution
checklist steps. All items MUST be initialized with status
`pending`.

#### Scenario: Fresh pipeline run

- **GIVEN** the user invokes `/uf.unleash` on an `opsx/*` branch
- **WHEN** the pipeline begins execution
- **THEN** the agent MUST call TodoWrite with all 11 steps
  (Steps 0-10) as `pending` before executing Step 0

#### Scenario: Fresh finale run

- **GIVEN** the user invokes `/uf.finale` on a feature branch
- **WHEN** the pipeline begins execution
- **THEN** the agent MUST call TodoWrite with all 8 steps
  (Steps 1-8) as `pending` before executing Step 1

#### Scenario: Fresh review-council run

- **GIVEN** the user invokes `/uf.review-council` on a feature
  branch
- **WHEN** the pipeline begins execution
- **THEN** the agent MUST call TodoWrite with all checklist
  items (phases and steps from the execution checklist) as
  `pending` before executing the first phase

#### Scenario: Fresh address-feedback run

- **GIVEN** the user invokes `/uf.address-feedback` on a feature
  branch
- **WHEN** the pipeline begins execution
- **THEN** the agent MUST call TodoWrite with all phases and
  sub-steps (from the execution checklist) as `pending` before
  executing Phase 1

### FR-002: Step-level TodoWrite updates

The agent MUST mark each step `in_progress` in TodoWrite before
starting execution of that step. The agent MUST mark each step
`completed` in TodoWrite after the step finishes successfully.

#### Scenario: Step transition visibility

- **GIVEN** the agent is executing Step 3 of `/uf.unleash`
- **WHEN** Step 3 completes successfully
- **THEN** the agent MUST mark Step 3 as `completed` in TodoWrite
  AND mark Step 4 as `in_progress` in TodoWrite before beginning
  Step 4 execution

#### Scenario: Step failure visibility

- **GIVEN** the agent is executing a pipeline step
- **WHEN** the step fails and the pipeline exits with an error
- **THEN** the failed step MUST remain as `in_progress` in
  TodoWrite (it was never completed) AND all subsequent steps
  MUST remain as `pending` in TodoWrite

### FR-003: TodoWrite coexistence with Edit tool checklist

The TodoWrite instructions MUST NOT replace the existing Edit tool
checklist instructions. Both mechanisms MUST be maintained:
- Edit tool checklist for resumability after context compression
- TodoWrite for real-time session UI visibility

#### Scenario: Both mechanisms updated together

- **GIVEN** the agent completes a pipeline step
- **WHEN** the agent processes the step completion
- **THEN** the agent MUST update both the Edit tool execution
  checklist (marking `[x]`) AND the TodoWrite list (marking
  `completed`)

### FR-004: TodoWrite re-initialization on resume

When resuming a pipeline from compressed context, the agent
SHOULD re-initialize the TodoWrite list from the execution
checklist state. Steps already marked `[x]` in the checklist
SHOULD be set to `completed` in TodoWrite. The first unchecked
step SHOULD be set to `in_progress`.

#### Scenario: Resume after context compression

- **GIVEN** the agent resumes `/uf.unleash` after context
  compression with Steps 0-4 marked `[x]` in the checklist
- **WHEN** the agent processes the session-resume guard
- **THEN** the agent SHOULD initialize TodoWrite with Steps 0-4
  as `completed`, Step 5 as `in_progress`, and Steps 6-10 as
  `pending`

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
