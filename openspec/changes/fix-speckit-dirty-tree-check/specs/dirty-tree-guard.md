## ADDED Requirements

### Requirement: Structured dirty-tree confirmation

When `speckit.specify.md` step 2 detects uncommitted changes via
`git status --short`, the agent MUST use an `AskUserQuestion` tool
call with structured options before proceeding. The agent MUST NOT
rely on prose-only instructions to gate branch creation.

The `AskUserQuestion` call MUST present exactly two options:
1. "Stash changes and continue"
2. "Abort -- keep changes as-is"

The question context MUST include the output of `git status --short`
so the user can see which files have uncommitted changes.

#### Scenario: Uncommitted changes detected

- **GIVEN** the user invokes `speckit.specify` and there are
  uncommitted changes in the working tree
- **WHEN** the agent runs `git status --short` and finds output
- **THEN** the agent MUST present an `AskUserQuestion` with two
  options: "Stash changes and continue" and "Abort -- keep changes
  as-is", including the git status output in the question context

#### Scenario: User chooses to stash and continue

- **GIVEN** uncommitted changes are detected and the user selects
  "Stash changes and continue"
- **WHEN** the agent processes the user's choice
- **THEN** the agent MUST run `git stash` before proceeding to
  `git checkout -b` for the new branch. Upon workflow completion,
  the agent MUST inform the user that their changes are stashed
  and can be restored with `git stash pop`.

#### Scenario: git stash fails

- **GIVEN** uncommitted changes are detected and the user selects
  "Stash changes and continue"
- **WHEN** the agent runs `git stash` and it returns a non-zero
  exit code
- **THEN** the agent MUST stop the workflow, report the stash
  failure to the user, and MUST NOT proceed to branch creation

#### Scenario: User explicitly requests new spec in same message

- **GIVEN** uncommitted changes exist AND the user's triggering
  message contains a `/speckit.specify <description>` invocation
  with a feature description
- **WHEN** the agent evaluates the dirty-tree check
- **THEN** the agent MAY skip the `AskUserQuestion` and proceed
  directly to branch creation

#### Scenario: User chooses to abort

- **GIVEN** uncommitted changes are detected and the user selects
  "Abort -- keep changes as-is"
- **WHEN** the agent processes the user's choice
- **THEN** the agent MUST stop the workflow immediately without
  creating a branch or modifying the working tree

#### Scenario: Clean working tree

- **GIVEN** the user invokes `speckit.specify` and there are no
  uncommitted changes
- **WHEN** the agent runs `git status --short` and finds no output
- **THEN** the agent MUST proceed directly to branch creation
  without presenting the `AskUserQuestion`

## MODIFIED Requirements

### Requirement: Dirty-tree check before branch creation

Previously: "STOP and ask the user for confirmation before
proceeding. Show the list of uncommitted files and warn that
switching branches with a dirty working tree may cause changes to
be applied to the wrong branch or lost."

Now: The agent MUST use an explicit `AskUserQuestion` tool call
with structured options as defined in the "Structured dirty-tree
confirmation" requirement above. Prose-only instructions for this
gate are insufficient and MUST NOT be used.

The existing exception clause is retained: the agent MAY skip this
check only if the user explicitly requested a new spec in the same
message that triggered the command.

## REMOVED Requirements

(None)
