## ADDED Requirements

### Requirement: Commit-state confirmation gate

The `openspec-archive-change` skill MUST include an
`AskUserQuestion` gate between step 5 (commit and push)
and step 6 (perform the archive) that requires the user
to confirm changes are committed before proceeding.

Before presenting the gate, the agent MUST run
`git status --short` and include the output in the
gate prompt so the user can make an evidence-based
decision rather than a trust-based confirmation.

The gate MUST present the following options:
- "Changes committed and pushed — proceed to archive"
- "Abort — need to commit first"

If the user selects "Abort", the skill MUST stop
execution, display which steps completed (1-5), and
NOT proceed to step 6 or step 7.

#### Scenario: User confirms clean state before archive

- **GIVEN** the agent has completed step 5 (commit and
  push all changes)
- **WHEN** the agent reaches the transition to step 6
- **THEN** the agent MUST present an `AskUserQuestion`
  gate with "proceed to archive" and "abort" options
  before executing any archive operations

#### Scenario: User aborts due to uncommitted changes

- **GIVEN** the agent presents the commit-state
  confirmation gate
- **WHEN** the user selects "Abort — need to commit first"
- **THEN** the agent MUST stop execution immediately
  and NOT proceed to step 6 (archive) or step 7
  (branch switch)

#### Constraint: Session resume behavior

The commit-state gate MUST be presented fresh in every
session regardless of prior context. Compressed or
resumed session state MUST NOT be treated as implicit
authorization to skip the gate. This constraint is
enforced by the gate instruction itself — if the
instruction says "always present this gate," the agent
presents it whether or not context was compressed.

### Requirement: Branch-switch confirmation gate

The `openspec-archive-change` skill MUST include an
`AskUserQuestion` gate before executing `git checkout
main` in step 7 that requires explicit user confirmation
to switch branches.

The gate MUST present the following options:
- "Return to main"
- "Stay on branch"

If the user selects "Stay on branch", the skill MUST
skip the `git checkout main` command and proceed to
the summary step.

#### Scenario: User confirms branch switch

- **GIVEN** the agent has completed the archive commit
  and push substeps within step 7
- **WHEN** the agent reaches the `git checkout main`
  substep within step 7
- **THEN** the agent MUST present an `AskUserQuestion`
  gate with "Return to main" and "Stay on branch"
  options before executing the checkout

#### Scenario: User stays on branch

- **GIVEN** the agent presents the branch-switch gate
- **WHEN** the user selects "Stay on branch"
- **THEN** the agent MUST skip `git checkout main`
  and proceed to step 8 (display summary), noting in
  the summary that the user remained on the opsx branch

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
