## ADDED Requirements

### Requirement: Acceptance Decision Confirmation Gate

The Muti-Mind agent MUST present an AskUserQuestion
confirmation prompt before invoking the
`go run cmd/mutimind/main.go decide` command. The prompt
MUST include the target backlog item ID, the proposed
decision (accept/reject/conditional), and the rationale
summary. The agent MUST NOT invoke the CLI command until
the user confirms.

Options: `["Confirm decision", "Abort"]`

If the user selects "Abort", the agent MUST NOT invoke
the decide command and MUST report that the acceptance
decision was cancelled.

#### Scenario: User confirms acceptance decision

- **GIVEN** the agent has evaluated a backlog item against
  its acceptance criteria and determined a decision
- **WHEN** the agent presents the AskUserQuestion prompt
  with the backlog item ID, decision, and rationale
- **THEN** if the user selects "Confirm decision", the
  agent invokes `go run cmd/mutimind/main.go decide`
  with the determined parameters

#### Scenario: User aborts acceptance decision

- **GIVEN** the agent has evaluated a backlog item and
  determined a decision
- **WHEN** the agent presents the AskUserQuestion prompt
- **THEN** if the user selects "Abort", the agent does
  not invoke the decide command and reports the
  cancellation

#### Scenario: Confirmation content accuracy

- **GIVEN** the agent is about to record an acceptance
  decision for backlog item BI-042 with decision
  "conditional" and rationale "Coverage meets threshold
  but edge cases need attention"
- **WHEN** the AskUserQuestion prompt is presented
- **THEN** the prompt MUST display "BI-042", "conditional",
  and the rationale text so the user can verify the
  parameters before confirmation

## MODIFIED Requirements

### Requirement: Acceptance Authority Section Structure

The "Acceptance Authority" section (lines 62-72) MUST
include both the existing CLI usage instructions and the
new confirmation gate. The confirmation gate MUST appear
before the CLI command block, following the same
positional pattern as the "Interactive Approval" rule
(line 60) relative to the story generation command.

Previously: The section contained only the CLI command
block and output format description with no confirmation
requirement.

## REMOVED Requirements

None.
