## ADDED Requirements

### FR-001: Explore-to-branch confirmation gate

When an agent in explore mode proposes creating a branch (either directly
via `git checkout -b` or by transitioning to `/opsx-propose`), the agent
MUST:

1. Check the current branch state:
   a. If already on the target `opsx/<name>` branch: skip branch
      creation, proceed without the gate.
   b. If on a different `opsx/*` branch: STOP with error:
      "Already on branch `opsx/<other>` -- finish or archive that
      change first."
   c. If on `main` or any non-opsx branch: proceed to step 2.
2. Present the proposed branch name and change name to the user.
   The branch name MUST be included in the `AskUserQuestion` prompt
   text so the user sees it alongside the confirmation options.
3. Check for uncommitted changes via `git status --short`. If
   uncommitted changes exist, the confirmation MUST show what
   changes exist and warn the user that switching branches with
   a dirty working tree may cause changes to be applied to the
   wrong branch.
4. Use the **AskUserQuestion tool** with options:
   - "Create branch and proceed"
   - "Stay in explore mode"
5. Only execute branch creation if the user selects "Create branch
   and proceed."

The agent MUST NOT create a branch, switch branches, or invoke
`/opsx-propose` without completing this confirmation gate.

Note: The `/opsx-propose` skill has its own independent branch guard
(Step 3). Both gates apply independently -- the explore gate fires
before the transition, and the propose gate fires within `/opsx-propose`.
The explore gate does NOT subsume the propose gate.

### Known Limitations

Instruction-based enforcement is not runtime-enforced. Agents may skip
the gate under context compression or session resumption. The structured
format with explicit tool call references and numbered steps is the
strongest mitigation available at the skill instruction level.

#### Scenario: Clean explore-to-propose transition

- **GIVEN** an agent is in explore mode on the `main` branch with no
  uncommitted changes
- **WHEN** the user says "Ready to start? Create a proposal."
- **THEN** the agent MUST include the proposed branch name (e.g.,
  `opsx/<change-name>`) in the **AskUserQuestion** prompt text and
  present options "Create branch and proceed" and "Stay in explore
  mode" before creating the branch

#### Scenario: Dirty working tree during transition

- **GIVEN** an agent is in explore mode with uncommitted changes in
  the working tree
- **WHEN** exploration leads to proposing a new branch
- **THEN** the agent MUST show what uncommitted changes exist, warn
  the user that switching branches may cause changes to be applied
  to the wrong branch, AND present the **AskUserQuestion**
  confirmation before any branch operation

#### Scenario: User declines branch creation

- **GIVEN** an agent is in explore mode and has presented the
  **AskUserQuestion** confirmation
- **WHEN** the user selects "Stay in explore mode"
- **THEN** the agent MUST remain in explore mode without creating
  a branch, switching branches, or invoking `/opsx-propose`

#### Scenario: Agent attempts direct branch creation

- **GIVEN** an agent is in explore mode
- **WHEN** the agent determines it should create a branch via
  `git checkout -b` directly (bypassing `/opsx-propose`)
- **THEN** the agent MUST still execute the full confirmation gate
  including **AskUserQuestion** before running the git command

#### Scenario: Explore-to-propose transition via /opsx-propose

- **GIVEN** an agent is in explore mode
- **WHEN** the agent recommends transitioning to `/opsx-propose`
- **THEN** the agent MUST execute the confirmation gate before
  invoking `/opsx-propose`
- **AND** the `/opsx-propose` skill's own branch guard applies
  independently after the transition

#### Scenario: Agent already on a different opsx branch

- **GIVEN** an agent is in explore mode on branch `opsx/<other>`
- **WHEN** the agent proposes creating a new branch
- **THEN** the agent MUST stop with an error instructing the user
  to finish or archive the current change first

#### Scenario: Agent already on the target opsx branch

- **GIVEN** an agent is in explore mode on branch `opsx/<name>`
- **WHEN** exploration leads to proposing a change with the same
  name (target branch is `opsx/<name>`)
- **THEN** the agent MUST skip branch creation (branch already
  exists) and proceed without the confirmation gate

## MODIFIED Requirements

### FR-002: Explore mode guardrail on branch switching (modified)

Previously: "Don't switch branches without confirmation - If exploration
leads to creating a proposal (which requires a new `opsx/` branch),
check for uncommitted changes first and ask the user before switching.
Never silently leave uncommitted work behind."

The advisory guardrail is replaced by the explicit confirmation gate
defined in FR-001 above. The requirement changes from SHOULD (advisory)
to MUST (enforced via **AskUserQuestion** tool call).

## REMOVED Requirements

None.
