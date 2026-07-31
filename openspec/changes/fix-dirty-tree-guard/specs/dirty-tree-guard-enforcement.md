## ADDED Requirements

### Requirement: FR-001 — Explicit AskUserQuestion on dirty tree detection

When `git status --short` produces any non-empty output (staged,
unstaged, or untracked files), the agent MUST invoke the
AskUserQuestion tool before proceeding to `git checkout -b`.

The AskUserQuestion prompt MUST include:
- The full output of `git status --short`
- The target branch name (`opsx/<name>`)
- A warning that switching branches with uncommitted changes may
  cause changes to appear on the wrong branch

The AskUserQuestion MUST offer exactly two options:

1. "Stash changes and continue"
2. "Abort — keep changes as-is"

The agent MUST NOT execute `git checkout -b` until the user has
responded. If the user selects "Abort", the agent MUST stop the
workflow and report that the change was not created.

If the user selects "Stash changes and continue", the agent MUST
run `git stash` before proceeding to `git checkout -b`. After
`git stash`, the agent MUST verify that `git status --short`
returns empty output before proceeding. If output is still
non-empty, the agent MUST abort and report the remaining
uncommitted changes.

If `git stash` returns a non-zero exit code, the agent MUST NOT
proceed to `git checkout -b`. The agent MUST report the stash
failure and abort the workflow.

#### Scenario: Dirty tree detected — user confirms stash

- **GIVEN** the working tree has uncommitted changes
- **WHEN** the agent runs `git status --short` and output is non-empty
- **THEN** the agent MUST invoke AskUserQuestion with options
  "Stash changes and continue" and "Abort — keep changes as-is"
- **AND** if the user selects "Stash changes and continue"
- **THEN** the agent MUST run `git stash` and proceed to
  `git checkout -b opsx/<name>`

#### Scenario: Dirty tree detected — user aborts

- **GIVEN** the working tree has uncommitted changes
- **WHEN** the agent runs `git status --short` and output is non-empty
- **THEN** the agent MUST invoke AskUserQuestion with options
  "Stash changes and continue" and "Abort — keep changes as-is"
- **AND** if the user selects "Abort — keep changes as-is"
- **THEN** the agent MUST NOT execute `git checkout -b`
- **AND** the agent MUST report that the operation was aborted

#### Scenario: Stash fails after user confirms

- **GIVEN** the working tree has uncommitted changes
- **WHEN** the user selects "Stash changes and continue"
- **AND** `git stash` returns a non-zero exit code
- **THEN** the agent MUST NOT execute `git checkout -b`
- **AND** the agent MUST report the stash failure to the user

#### Scenario: Partial stash — uncommitted changes remain

- **GIVEN** the working tree has uncommitted changes
- **WHEN** the user selects "Stash changes and continue"
- **AND** `git stash` succeeds (exit code 0)
- **BUT** `git status --short` still produces non-empty output
- **THEN** the agent MUST NOT execute `git checkout -b`
- **AND** the agent MUST report the remaining uncommitted changes

#### Scenario: Clean working tree — no prompt

- **GIVEN** the working tree has no uncommitted changes
- **WHEN** the agent runs `git status --short` and output is empty
- **THEN** the agent MUST proceed directly to branch creation
  without invoking AskUserQuestion for dirty-tree confirmation

## MODIFIED Requirements

### Requirement: FR-002 — Dirty tree guard applies to both files

The dirty-tree guard with AskUserQuestion enforcement MUST be
present in both:
- `.opencode/skills/openspec-propose/SKILL.md`
- `.opencode/commands/opsx-propose.md`

Previously: The guard was described in prose only, without specifying
AskUserQuestion as the enforcement mechanism.

## REMOVED Requirements

None.
