## Context

The `2026-04-28-inline-stop-instructions` change added STOP
HERE gates to 9 spec-phase commands. However, in two files
(`speckit.tasks.md` and `speckit.plan.md`), the gate was
placed after the workflow steps rather than before them.

An LLM agent processes command files sequentially. When the
STOP instruction appears after a numbered workflow, the agent
completes all steps and enters "what next?" mode before it
encounters the boundary. The fix is to reposition the gate
as a preamble so the agent reads it before executing the
workflow.

## Goals / Non-Goals

### Goals
- Move STOP HERE gate in `speckit.tasks.md` from after
  step 5 to a bolded preamble before step 1
- Move STOP HERE gate in `speckit.plan.md` from after
  step 4 to a bolded preamble before step 1
- Preserve the existing wording and intent of the gate
- Establish a preamble placement pattern for STOP gates
  (no commands currently use preamble placement; this
  change creates the pattern for the 2 files cited in
  #363, with a follow-up for the remaining 5)

### Non-Goals
- Modifying the gate text or adding new guardrail language
- Changing any other command files (the other 5 speckit
  commands have the same post-workflow placement but are
  not cited in issue #363; a follow-up issue should be
  filed to address them)
- Adding runtime enforcement of phase boundaries (this is
  a behavioral instruction fix only)

## Decisions

**D1: Preamble placement, not duplication**

Move the STOP block rather than duplicating it. Each file
should have exactly one inline STOP instruction to avoid
confusion about which is authoritative. The end-of-workflow
position is removed and the preamble position is added.

**D2: Position immediately after Outline heading**

Place the STOP block as the first content after the
`## Outline` heading, before step 1. This is the earliest
point where the agent has workflow context and ensures
the boundary is read before any workflow steps execute.

**D3: Preserve existing wording**

Use the exact same STOP HERE text that is already in the
files. The wording is consistent across all spec-phase
commands.

## Risks / Trade-offs

**Low risk**: This is a text repositioning change within
2 Markdown files. No code, no tests, no schema changes.

**Trade-off**: Placing the gate at the very top of the
Outline means the agent reads it before it has context
about what the workflow does. However, this follows the
explicit recommendation in issue #363 and establishes
a pattern that can be applied to the remaining commands
in a follow-up.

**Known limitation**: The same post-workflow STOP gate
placement exists in 5 other speckit commands
(`speckit.specify.md`, `speckit.clarify.md`,
`speckit.analyze.md`, `speckit.checklist.md`,
`speckit.testreview.md`). This change fixes only the
2 files cited in #363. A follow-up issue should be
filed to apply the preamble pattern consistently.
