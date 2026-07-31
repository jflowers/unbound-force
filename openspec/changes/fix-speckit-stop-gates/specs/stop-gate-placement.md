## ADDED Requirements

_None._

## MODIFIED Requirements

### Requirement: STOP HERE gate position in speckit.tasks.md

The STOP HERE phase-boundary block in `speckit.tasks.md`
MUST appear immediately after the `## Outline` heading and
before the first numbered workflow step (Step 1).

Previously: The STOP HERE block appeared at line 70, after
Step 5 (the final workflow step) and before Step 6 (Report).

#### Scenario: LLM processes speckit.tasks command

- **GIVEN** an LLM is executing the `speckit.tasks` command
- **WHEN** it reads the `## Outline` section
- **THEN** it MUST encounter the STOP HERE block before any
  numbered workflow step

#### Scenario: STOP HERE block content preserved

- **GIVEN** the STOP HERE block is moved to preamble position
  in `speckit.tasks.md`
- **WHEN** the block content is compared to the canonical
  format from `uf-init.md`
- **THEN** the wording MUST be identical to the canonical
  STOP HERE block

### Requirement: STOP HERE gate position in speckit.plan.md

The STOP HERE phase-boundary block in `speckit.plan.md`
MUST appear immediately after the `## Outline` heading and
before the first numbered workflow step (Step 1).

Previously: The STOP HERE block appeared at line 39, after
Step 4 (the final workflow step) and before the `## Phases`
section.

#### Scenario: LLM processes speckit.plan command

- **GIVEN** an LLM is executing the `speckit.plan` command
- **WHEN** it reads the `## Outline` section
- **THEN** it MUST encounter the STOP HERE block before any
  numbered workflow step

#### Scenario: STOP HERE block content preserved

- **GIVEN** the STOP HERE block is moved to preamble position
  in `speckit.plan.md`
- **WHEN** the block content is compared to the canonical
  format from `uf-init.md`
- **THEN** the wording MUST be identical to the canonical
  STOP HERE block

### Requirement: uf-init STOP HERE placement instruction

The `uf-init.md` Step 10 placement instruction MUST direct
insertion of STOP HERE blocks immediately after the
`## Outline` heading (or equivalent section heading) and
before the first numbered workflow step.

Previously: The instruction directed placement "After the
main workflow instructions, before the `## Guardrails`
section."

#### Scenario: Future uf-init scaffolding

- **GIVEN** an operator runs `uf init` on a new project
- **WHEN** Step 10 injects STOP HERE blocks into spec-phase
  speckit command files
- **THEN** each STOP HERE block MUST be placed immediately
  after the `## Outline` heading and before the first
  numbered step

### Requirement: No duplicate STOP HERE blocks

After the move operation, each affected file MUST contain
exactly one STOP HERE block. No duplicate blocks SHALL
remain at the old position.

#### Scenario: Duplicate detection after move

- **GIVEN** the STOP HERE block has been moved in
  `speckit.tasks.md` or `speckit.plan.md`
- **WHEN** the file is searched for "STOP HERE"
  (case-sensitive)
- **THEN** exactly one match MUST be found

## REMOVED Requirements

_None._
