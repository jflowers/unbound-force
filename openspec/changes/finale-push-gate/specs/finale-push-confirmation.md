## ADDED Requirements

### Requirement: FR-001 Mandatory push confirmation gate

The `/finale` command MUST present an AskUserQuestion
gate immediately before executing `git push` in Step 4
("Push to Remote"). The gate MUST use structured
options with action-context labels:
`["Push to remote", "Abort -- keep commits local"]`.

The agent MUST NOT execute `git push` unless the user
selects "Push to remote".

If the user selects "Abort -- keep commits local", the
agent MUST stop the push operation, report that local
commits are preserved, and **STOP** the `/finale` workflow
(do not proceed to Step 5 or any subsequent steps).

#### Scenario: User confirms push

- **GIVEN** the agent has completed Step 3 (commit)
  and is in Step 4 (Push to Remote)
- **WHEN** the agent reaches the push execution point
- **THEN** the agent MUST present an AskUserQuestion
  with options `["Push to remote",
  "Abort -- keep commits local"]`
- **AND** only execute `git push` if the user selects
  "Push to remote"

#### Scenario: User aborts push

- **GIVEN** the agent has completed Step 3 and is in
  Step 4
- **WHEN** the agent presents the AskUserQuestion gate
  and the user selects "Abort -- keep commits local"
- **THEN** the agent MUST NOT execute `git push`
- **AND** the agent MUST report that local commits are
  preserved
- **AND** the agent MUST **STOP** the `/finale` workflow
  (do not proceed to Step 5 or any subsequent steps)

#### Scenario: Branch divergence detected

- **GIVEN** the agent is in Step 4 and has detected
  that the local and remote branches have diverged
- **WHEN** the agent reaches the push execution point
- **THEN** the agent MUST warn the user about the
  divergence before presenting the AskUserQuestion
  gate
- **AND** the gate options MUST still be
  `["Push to remote", "Abort -- keep commits local"]`

### Requirement: FR-002 Scaffold asset parity

The scaffold asset copy at
`internal/scaffold/assets/opencode/commands/finale.md`
MUST be updated to be byte-identical with the command
file at `.opencode/commands/finale.md`.

#### Scenario: Drift detection passes

- **GIVEN** both copies of `finale.md` exist
- **WHEN** the scaffold drift detection test runs
- **THEN** both files MUST have identical content
- **AND** the test MUST pass

## MODIFIED Requirements

### Requirement: Step 4 push flow

Previously: Step 4 executed `git push` (or
`git push -u origin <branch>`) immediately after the
upstream check with no user confirmation.

Now: Step 4 MUST include an AskUserQuestion gate
between the upstream/divergence check and the actual
`git push` execution.

## REMOVED Requirements

None.
