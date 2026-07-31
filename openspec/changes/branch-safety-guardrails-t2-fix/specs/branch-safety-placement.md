## ADDED Requirements

### Requirement: Branch Safety Pre-conditions in cobalt-crush-dev

The `cobalt-crush-dev.md` agent file MUST contain a
Pre-conditions subsection with branch safety guardrails.
This section MUST appear before the "Code Implementation
Checklist" section. The pre-condition MUST instruct the
agent to verify branch state and check for uncommitted
changes before any branch switch operation.

#### Scenario: Agent encounters branch operation during implementation

- **GIVEN** the cobalt-crush-dev agent is processing
  instructions from `cobalt-crush-dev.md`
- **WHEN** the agent reaches any instruction that involves
  switching branches or suggesting a branch switch
- **THEN** the agent SHALL have already processed the
  Pre-conditions section containing branch safety rules
  AND the agent MUST check `git status --short` for
  uncommitted changes before proceeding

## MODIFIED Requirements

### Requirement: Branch safety rule placement in openspec-apply-change

The branch safety rule in `openspec-apply-change/SKILL.md`
MUST appear as a Pre-condition block immediately after the
"Steps" heading and before Step 1, rather than in the
Guardrails section at the end of the file.

Previously: The rule "NEVER switch branches or suggest
archiving with uncommitted changes" appeared at line 212
within the Guardrails section, after all workflow steps.

#### Scenario: Agent processes apply-change workflow

- **GIVEN** the openspec-apply-change skill is loaded
- **WHEN** the agent begins processing the Steps section
- **THEN** the agent SHALL encounter the branch safety
  pre-condition before Step 1 (Select the change)
  AND the pre-condition MUST state: "NEVER switch branches
  or suggest archiving with uncommitted changes"

#### Scenario: Guardrails section after modification

- **GIVEN** the branch safety rule has been moved to
  Pre-conditions
- **WHEN** reviewing the Guardrails section
- **THEN** the Guardrails section MUST NOT contain a
  duplicate of the branch safety rule

### Requirement: Branch safety section placement in speckit-workflow

The Branch Safety content in `speckit-workflow/SKILL.md`
MUST appear as a "Pre-conditions" section before the
"Reading tasks.md" section, rather than as a standalone
section at the end of the file.

Previously: The "Branch Safety" section appeared at
line 114, after the full workflow (lines 18-113).

#### Scenario: Agent processes speckit workflow

- **GIVEN** the speckit-workflow skill is loaded
- **WHEN** the agent begins reading the skill instructions
- **THEN** the agent SHALL encounter the Pre-conditions
  section with branch safety rules BEFORE the
  "Reading tasks.md" section
  AND the pre-condition MUST state that all work MUST
  be committed and pushed before any branch switch

#### Scenario: Original Branch Safety section removal

- **GIVEN** the branch safety content has been moved to
  Pre-conditions
- **WHEN** reviewing the file structure
- **THEN** the original "Branch Safety" section (previously
  at lines 114-128) SHALL be removed

## REMOVED Requirements

None.
