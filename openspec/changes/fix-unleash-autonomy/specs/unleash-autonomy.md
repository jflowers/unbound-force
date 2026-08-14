## ADDED Requirements

### Requirement: Inter-step autonomy guardrail

The `/uf.unleash` command MUST include a guardrail that
explicitly prohibits pausing between pipeline steps for
human confirmation. The guardrail MUST enumerate the only
valid exit points where the pipeline MAY halt.

#### Scenario: Agent reaches a step checkpoint

- **GIVEN** the agent completes a pipeline step (Steps 0-9)
- **WHEN** the agent processes the step's CHECKPOINT block
- **THEN** the agent MUST proceed immediately to the next
  step without asking the human for confirmation

#### Scenario: Agent encounters a valid exit condition

- **GIVEN** the agent is executing any pipeline step
- **WHEN** the agent encounters a documented STOP/EXIT
  condition (HIGH/CRITICAL spec findings, build/test
  failure, merge conflict, 3 review iterations exhausted)
- **THEN** the agent MUST halt and present the exit
  message with actionable next steps, as before

### Requirement: Explicit checkpoint transitions

Each step checkpoint (Steps 0-9) that precedes another
step MUST include an explicit transition instruction
directing the agent to proceed immediately to the next
step. The transition instruction MUST state:
1. The specific next step to proceed to
2. An explicit prohibition on asking for confirmation

The final checkpoint (Step 10) MUST NOT include a
transition instruction since no subsequent step exists.

#### Scenario: Step 7 checkpoint transition

- **GIVEN** the agent completes Step 7 (Implement)
- **WHEN** the agent marks Step 7 complete in the
  execution checklist
- **THEN** the checkpoint MUST instruct the agent to
  "proceed immediately to Step 8" and "do NOT ask for
  confirmation"

#### Scenario: Consistent checkpoint format

- **GIVEN** the `/uf.unleash` command template
- **WHEN** inspecting checkpoint blocks for Steps 0-9
- **THEN** each checkpoint MUST contain both the
  execution checklist marker AND an explicit transition
  instruction to the next step

## MODIFIED Requirements

### Requirement: Guardrails section completeness

The Guardrails section MUST include an autonomy guardrail
as the first rule. Previously: the section contained 8
guardrails covering branch safety, spec review exits,
merge conflicts, exit messages, retrospective storage,
worktree cleanup, WorkflowInstance prohibition, and build
command derivation, but did not address inter-step
autonomy.

## REMOVED Requirements

None.
