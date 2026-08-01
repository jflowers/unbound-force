## ADDED Requirements

None.

## MODIFIED Requirements

### Requirement: STOP gate position in speckit commands

Each speckit command file MUST position its STOP HERE
block as a bolded preamble immediately after the first
major `## ` heading, before any workflow steps.

Previously: The STOP HERE block was positioned after
the final workflow step in 5 of 7 speckit command files.

#### Scenario: Agent reads speckit.specify.md

- **GIVEN** the agent loads `speckit.specify.md`
- **WHEN** it reads past the `## Outline` heading
- **THEN** it MUST encounter the STOP HERE block before
  any numbered workflow step

#### Scenario: Agent reads speckit.clarify.md

- **GIVEN** the agent loads `speckit.clarify.md`
- **WHEN** it reads past the `## Outline` heading
- **THEN** it MUST encounter the STOP HERE block before
  any numbered workflow step

#### Scenario: Agent reads speckit.analyze.md

- **GIVEN** the agent loads `speckit.analyze.md`
- **WHEN** it reads past the `## Goal` heading
- **THEN** it MUST encounter the STOP HERE block before
  any numbered workflow step

#### Scenario: Agent reads speckit.checklist.md

- **GIVEN** the agent loads `speckit.checklist.md`
- **WHEN** it reads past the `## Execution Steps`
  heading
- **THEN** it MUST encounter the STOP HERE block before
  any numbered workflow step

#### Scenario: Agent reads speckit.testreview.md

- **GIVEN** the agent loads `speckit.testreview.md`
- **WHEN** it reads past the `## Goal` heading
- **THEN** it MUST encounter the STOP HERE block before
  any numbered workflow step

#### Scenario: No duplicate STOP blocks

- **GIVEN** any speckit command file
- **WHEN** the STOP HERE block is moved to preamble
  position
- **THEN** the file MUST contain exactly one STOP HERE
  block (the original at the end MUST be removed)

## REMOVED Requirements

None.
