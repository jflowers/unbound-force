## ADDED Requirements

### Requirement: FR-001 Secrets gate AskUserQuestion call

When `/uf.finale` Step 2 detects potential secret files in
the working tree, the agent MUST invoke the AskUserQuestion
tool with exactly two options before proceeding to
`git add .`.

Options:
1. "Yes -- stage all files and continue"
2. "No -- stop here"

The agent MUST NOT run `git add .` until the user responds.

#### Scenario: Secret file detected and user approves

- **GIVEN** the working tree contains a file matching secret
  patterns (e.g., `.env.local`, `credentials.json`)
- **WHEN** `/uf.finale` reaches Step 2 secrets check
- **THEN** the agent MUST display the warning message listing
  the detected files AND invoke the AskUserQuestion tool
  with the two options above
- **AND** when the user selects "Yes -- stage all files and
  continue", the agent proceeds to `git add .`

#### Scenario: Secret file detected and user declines

- **GIVEN** the working tree contains a file matching secret
  patterns
- **WHEN** `/uf.finale` reaches Step 2 secrets check AND the
  user selects "No -- stop here"
- **THEN** the agent MUST stop execution immediately
- **AND** the agent MUST NOT run `git add .`
- **AND** the agent MUST NOT proceed to Step 3 or any
  subsequent steps

#### Scenario: No secret files detected

- **GIVEN** the working tree contains only non-secret files
- **WHEN** `/uf.finale` reaches Step 2 secrets check
- **THEN** the agent SHALL proceed directly to `git add .`
  without invoking AskUserQuestion

### Requirement: FR-002 Scaffold file sync

The scaffold asset copy at `internal/scaffold/assets/opencode/
commands/uf.finale.md` MUST receive identical changes to the
command file at `.opencode/commands/uf.finale.md`.

#### Scenario: Both files updated identically

- **GIVEN** the change modifies `.opencode/commands/
  uf.finale.md`
- **WHEN** the change is applied
- **THEN** `internal/scaffold/assets/opencode/commands/
  uf.finale.md` MUST contain identical content
- **AND** existing drift detection tests MUST pass

## MODIFIED Requirements

### Requirement: Secrets check confirmation mechanism

The secrets check confirmation in Step 2 of `/uf.finale`
MUST use an explicit AskUserQuestion tool call instead of
prose instructions.

Previously: "Ask for confirmation. If the user declines,
stop and let them handle it manually."

New: An AskUserQuestion tool call with explicit options and
a STOP instruction on decline.

## REMOVED Requirements

None.
