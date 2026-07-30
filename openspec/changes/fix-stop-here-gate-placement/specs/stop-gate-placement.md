## ADDED Requirements

None.

## MODIFIED Requirements

### Requirement: STOP-GATE-001 — Gate Positioning

Phase-boundary STOP instructions in spec-phase command
files MUST appear as a preamble before step 1 of the
workflow, not after the final workflow step.

Previously: STOP instructions were positioned after the
main workflow steps (between steps 5 and 6 in
`speckit.tasks.md`, after step 4 in `speckit.plan.md`).
Note: the same post-workflow placement exists in 5 other
speckit commands; those are out of scope for this change
and should be addressed in a follow-up issue.

#### Scenario: Agent executes speckit.tasks workflow

- **GIVEN** an agent is executing `speckit.tasks.md`
- **WHEN** the agent reads the Outline section
- **THEN** the STOP HERE instruction MUST be the first
  content after the `## Outline` heading, before step 1

#### Scenario: Agent executes speckit.plan workflow

- **GIVEN** an agent is executing `speckit.plan.md`
- **WHEN** the agent reads the Outline section
- **THEN** the STOP HERE instruction MUST be the first
  content after the `## Outline` heading, before step 1

#### Scenario: STOP gate text is preserved

- **GIVEN** the STOP HERE block is repositioned
- **WHEN** comparing the text before and after the move
- **THEN** the wording MUST be identical to the existing
  gate text (no additions, no removals)

## REMOVED Requirements

None.
