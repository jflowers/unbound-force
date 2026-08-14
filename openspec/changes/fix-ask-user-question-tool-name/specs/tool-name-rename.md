## ADDED Requirements

No new requirements are added by this change.

## MODIFIED Requirements

### Requirement: Interactive gate tool references

All command, agent, and skill files that instruct agents to
use an interactive confirmation gate MUST reference the tool
by its actual OpenCode registry name: `question`.

Previously: Files referenced `AskUserQuestion tool`, which
does not exist in OpenCode's tool registry, causing agents
to potentially skip interactive gates.

#### Scenario: Agent encounters an interactive gate instruction

- **GIVEN** an agent is executing a command that contains an
  interactive confirmation gate
- **WHEN** the agent reads the instruction to invoke a tool
  for user confirmation
- **THEN** the tool name in the instruction MUST be `question`,
  matching OpenCode's actual tool registry entry

#### Scenario: Scaffold asset drift detection

- **GIVEN** the `.opencode/` source files have been updated
  with the corrected tool name
- **WHEN** drift detection tests compare source files against
  their embedded copies in `internal/scaffold/assets/opencode/`
- **THEN** the embedded copies MUST contain the same corrected
  tool name references, and drift detection tests MUST pass

#### Scenario: Gate logic preservation

- **GIVEN** a command file contains interactive gate logic
  (conditions, options, abort behavior)
- **WHEN** the tool name reference is updated from
  `AskUserQuestion` to `question`
- **THEN** all surrounding gate logic (conditions, option
  lists, abort handling) MUST remain unchanged

## REMOVED Requirements

No requirements are removed by this change.
