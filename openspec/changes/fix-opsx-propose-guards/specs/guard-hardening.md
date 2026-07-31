## ADDED Requirements

### Requirement: Dirty-tree AskUserQuestion enforcement (FR-001)

When the dirty-tree guard detects uncommitted changes, the agent
MUST invoke the AskUserQuestion tool with the following options:
- "Stash changes and continue"
- "Abort -- keep changes as-is"

The agent MUST NOT proceed to branch creation until the user has
responded. If the user selects "Abort", the agent MUST halt the
workflow immediately.

#### Scenario: Dirty tree detected with uncommitted changes

- **GIVEN** the working tree has uncommitted changes (staged,
  unstaged, or untracked files related to work)
- **WHEN** the agent reaches the dirty-tree guard in Step 3
- **THEN** the agent MUST invoke AskUserQuestion with options
  ["Stash changes and continue", "Abort -- keep changes as-is"]
  and MUST NOT proceed until the user responds

#### Scenario: User selects abort on dirty tree

- **GIVEN** the AskUserQuestion prompt is displayed for a dirty
  working tree
- **WHEN** the user selects "Abort -- keep changes as-is"
- **THEN** the agent MUST halt the workflow immediately and
  report that the change was not created due to uncommitted work

#### Scenario: User selects stash on dirty tree

- **GIVEN** the AskUserQuestion prompt is displayed for a dirty
  working tree
- **WHEN** the user selects "Stash changes and continue"
- **THEN** the agent MUST run `git stash --include-untracked` to
  preserve all uncommitted work, verify the stash succeeded (exit
  code 0), and THEN proceed with branch creation

#### Scenario: Stash operation fails

- **GIVEN** the user selects "Stash changes and continue"
- **WHEN** `git stash --include-untracked` fails (non-zero exit code)
- **THEN** the agent MUST halt the workflow immediately and report
  the stash failure to the user. The agent MUST NOT proceed to
  branch creation with a dirty working tree.

### Requirement: STOP HERE preamble placement (FR-002)

Both the command file and the skill file MUST contain a bolded
preamble block before the `**Steps**` section that states the
implementation constraint. The preamble MUST appear before any
workflow steps.

The preamble MUST include:
- A statement that this command creates artifacts ONLY
- An explicit prohibition against implementing code changes
- An explicit prohibition against committing, pushing, or
  creating PRs
- An explicit prohibition against running /unleash, /opsx-apply,
  or /cobalt-crush

#### Scenario: Preamble is present before steps

- **GIVEN** an agent loads the opsx-propose command or
  openspec-propose skill
- **WHEN** the agent parses the instruction document
- **THEN** the STOP HERE constraint MUST appear before the
  first numbered step in the Steps section

#### Scenario: Post-workflow STOP HERE is retained

- **GIVEN** an agent loads the opsx-propose command or
  openspec-propose skill
- **WHEN** the agent reaches the end of Step 6
- **THEN** a STOP HERE block MUST still appear after Step 6
  as reinforcement

## MODIFIED Requirements

### Requirement: Dirty-tree guard description (FR-003)

The dirty-tree guard in Step 3 MUST include an explicit
AskUserQuestion tool call specification with concrete options,
in addition to the existing prose description.

Previously: The guard described the check in prose only,
instructing the agent to "STOP and ask the user for confirmation"
without specifying which tool to use or what options to present.

## REMOVED Requirements

None.
