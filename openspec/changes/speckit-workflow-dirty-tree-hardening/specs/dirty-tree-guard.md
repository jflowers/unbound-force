## ADDED Requirements

### Requirement: Explicit AskUserQuestion gate for dirty-tree detection

When the speckit-workflow skill detects uncommitted changes
before branch creation, the agent MUST invoke the
`AskUserQuestion` tool with exactly two options:
1. "Stash changes and continue"
2. "Abort -- keep changes as-is"

The agent MUST include the `git status --short` output in the
question text so the user can see which files are affected.

The agent MUST NOT proceed to branch creation until the user
responds.

#### Scenario: Agent detects uncommitted changes before branch switch

- **GIVEN** the agent is executing the speckit-workflow skill
  and needs to create or switch to a feature branch
- **AND** `git status --short` returns non-empty output
- **WHEN** the agent reaches the dirty-tree check
- **THEN** the agent MUST invoke the `AskUserQuestion` tool
  with the two options listed above and the `git status` output
- **AND** the agent MUST NOT run `git checkout -b` until the
  user responds

#### Scenario: User selects "Stash changes and continue"

- **GIVEN** the agent has presented the dirty-tree
  `AskUserQuestion` gate
- **WHEN** the user selects "Stash changes and continue"
- **THEN** the agent MUST run `git stash`
- **AND** if `git stash` exits with a non-zero exit code, the
  agent MUST abort the workflow and report the stash failure
- **AND** if `git stash` succeeds, the agent MUST re-run
  `git status --short` to verify the working tree is clean
- **AND** if the working tree is still not clean after stash,
  the agent MUST abort and report the remaining changes
- **AND** only when the working tree is confirmed clean SHALL
  the agent proceed to branch creation

#### Scenario: User selects "Abort -- keep changes as-is"

- **GIVEN** the agent has presented the dirty-tree
  `AskUserQuestion` gate
- **WHEN** the user selects "Abort -- keep changes as-is"
- **THEN** the agent MUST stop the workflow immediately
- **AND** the agent MUST NOT create a branch or modify the
  working tree
- **AND** the agent MUST report that the operation was aborted
  due to uncommitted changes

### Requirement: Post-stash user notification

When the agent successfully stashes changes and completes the
workflow, the agent SHOULD inform the user that their changes
are stashed and can be restored with `git stash pop`.

#### Scenario: Workflow completes after stash

- **GIVEN** the agent stashed changes at the start of the
  workflow
- **WHEN** the workflow completes successfully
- **THEN** the agent SHOULD remind the user that their changes
  are stashed and can be restored with `git stash pop`

### Requirement: Scaffold copy synchronization

The scaffold copy at
`internal/scaffold/assets/opencode/skills/speckit-workflow/SKILL.md`
MUST contain identical content to the source file at
`.opencode/skills/speckit-workflow/SKILL.md`.

#### Scenario: Source and scaffold diverge

- **GIVEN** the source SKILL.md has been updated
- **WHEN** the scaffold copy is not updated with the same
  content
- **THEN** the existing drift-detection tests MUST fail

## MODIFIED Requirements

### Requirement: Pre-conditions dirty-tree check

The Pre-conditions section MUST use explicit `AskUserQuestion`
tool calls with structured options instead of prose-only
instructions.

Previously: "If uncommitted changes exist, **STOP** and ask
the user for confirmation before switching branches."

## REMOVED Requirements

None.
