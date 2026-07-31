## ADDED Requirements

### Requirement: Branch switch confirmation gate

The `/opsx-archive` workflow MUST present an `AskUserQuestion`
confirmation gate before executing `git checkout main`. This
requirement applies to both entry points:
- `.opencode/commands/opsx-archive.md` (Step 6)
- `.opencode/skills/openspec-archive-change/SKILL.md` (Step 7)

The gate MUST use the `AskUserQuestion tool` with options
`["Return to main", "Stay on branch"]`.

If the user selects "Stay on branch", the workflow MUST skip
the `git checkout main` step and proceed directly to the
summary display. The summary MUST note that the user remained
on the `opsx/<name>` branch.

#### Scenario: User confirms return to main

- **GIVEN** the archive move has completed successfully
- **WHEN** the agent presents the branch switch confirmation
- **AND** the user selects "Return to main"
- **THEN** the agent MUST execute `git checkout main`
- **AND** the summary MUST show "Branch: returned to main"

#### Scenario: User chooses to stay on branch

- **GIVEN** the archive move has completed successfully
- **WHEN** the agent presents the branch switch confirmation
- **AND** the user selects "Stay on branch"
- **THEN** the agent MUST NOT execute `git checkout main`
- **AND** the summary MUST show "Branch: stayed on
  opsx/<name>"

## MODIFIED Requirements

### Requirement: Target-exists guard clarity

In the "Perform the archive" step, the `mv` command block
MUST be explicitly marked as conditional on the target-exists
check. The target-exists check text and the `mv` command are
already in the correct order (check first, command second),
but the `mv` code fence appears as a visually separate block
that could be interpreted as an unconditional instruction.

The corrected structure MUST make the conditional relationship
explicit by adding guard language before the `mv` code fence
(e.g., "If the target does not exist, execute:") so agents
treat the command as guarded rather than unconditional.

This requirement applies to both entry points:
- `.opencode/commands/opsx-archive.md` (Step 5)
- `.opencode/skills/openspec-archive-change/SKILL.md` (Step 6)

Previously: The `mv` code fence appeared as a standalone
instruction after the target-exists check text, with no
explicit conditional language linking the two. An agent
could interpret the code fence as "always execute" rather
than as the "If no" branch of the preceding check.

#### Scenario: Target archive does not exist

- **GIVEN** the archive directory exists at
  `openspec/changes/archive/`
- **AND** no directory exists at
  `openspec/changes/archive/YYYY-MM-DD-<name>`
- **WHEN** the agent reaches the "Perform the archive" step
- **THEN** the agent MUST first verify the target does
  not exist
- **AND** the `mv` command MUST appear under explicit
  conditional language indicating it runs only when the
  target does not exist
- **AND** then execute the `mv` command

#### Scenario: Target archive already exists

- **GIVEN** a directory already exists at
  `openspec/changes/archive/YYYY-MM-DD-<name>`
- **WHEN** the agent reaches the "Perform the archive" step
- **THEN** the agent MUST detect the existing target
  before attempting any `mv` operation
- **AND** MUST fail with an error suggesting alternatives
- **AND** the `mv` command MUST NOT be executed

## REMOVED Requirements

No requirements are removed by this change.
