## ADDED Requirements

### Requirement: Pre-conditions section placement

The `speckit-workflow/SKILL.md` file MUST contain a "Pre-conditions"
section placed after "When This Skill Applies" and before "Reading
tasks.md". This section MUST contain all CRITICAL safety rules that
govern the workflow.

#### Scenario: Agent processes skill file sequentially

- **GIVEN** an agent loads `speckit-workflow/SKILL.md`
- **WHEN** it processes sections in document order
- **THEN** it MUST encounter the "Pre-conditions" section (containing
  branch safety rules) before any workflow step that could trigger a
  branch switch

#### Scenario: Branch safety content completeness

- **GIVEN** the "Pre-conditions" section exists in the skill file
- **WHEN** an agent reads the pre-conditions
- **THEN** it MUST find all of the following rules:
  - All work MUST be committed and pushed before any branch switch
  - After completing all phases, commit and push before PR creation
  - Before creating a new feature branch, check `git status --short`
  - Never silently switch branches with a dirty working tree

## MODIFIED Requirements

### Requirement: Branch safety rule location

Branch safety rules MUST appear in the "Pre-conditions" section of
the skill file, not in a trailing "Branch Safety" section after the
workflow steps.

Previously: Branch safety rules were in a "Branch Safety" section
at lines 114-129, after the full workflow (lines 18-113).

#### Scenario: No trailing branch safety section

- **GIVEN** the skill file has been updated per this change
- **WHEN** an agent or reviewer scans for a "Branch Safety" heading
  after the workflow sections
- **THEN** no such section SHALL exist; the content MUST reside
  solely in "Pre-conditions"

## REMOVED Requirements

### Requirement: Standalone "Branch Safety" section

The standalone "Branch Safety" section (previously at lines 114-129)
is removed. Its content is relocated to the "Pre-conditions" section.
Reason: T2 weakness — CRITICAL rules placed after the workflow they
govern.
