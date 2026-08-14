## Context

`/uf.unleash` executes a sequential pipeline (Steps 0-10)
designed for fully autonomous operation. The command file
(`uf.unleash.md`) contains 8 guardrails and 11 checkpoint
instructions. Agents are halting between steps to ask for
human confirmation because:

1. No guardrail explicitly prohibits inter-step
   confirmation-seeking
2. Checkpoint instructions say "before proceeding" without
   specifying what "proceeding" means (immediate
   continuation vs. awaiting permission)

The prior learning `inline-stop-instructions-1` established
that behavioral instructions MUST be positioned at the
decision point. This fix applies that same pattern --
placing "proceed immediately" instructions at each
transition checkpoint.

## Goals / Non-Goals

### Goals
- Add an explicit autonomy guardrail to the Guardrails
  section prohibiting inter-step confirmation-seeking
- Add explicit "proceed immediately" transition
  instructions at all step checkpoints that precede
  another step (Steps 0-9)
- Audit all 11 checkpoint transitions for consistency,
  not just the three identified in the issue (7->8,
  8->9, 9->10)
- Preserve all existing STOP/EXIT conditions unchanged

### Non-Goals
- Modifying the pipeline's step logic or order
- Changing the documented exit points (HIGH/CRITICAL
  findings, build failures, merge conflicts, review
  iteration exhaustion)
- Adding automated testing for prompt behavior (not
  feasible for prompt engineering changes)
- Modifying the scaffold engine or Go source code

## Decisions

### D1: Audit all 11 checkpoints, not just 3

The issue identifies Steps 7->8, 8->9, and 9->10 as
affected. However, the same ambiguous "before proceeding"
language appears at all 11 checkpoint transitions. For
consistency and to prevent the same bug from manifesting
at earlier transitions, the fix will add transition
instructions at all checkpoints that precede another step
(Steps 0-9). Step 10's checkpoint says "Pipeline
complete" and does not need a transition instruction.

This aligns with the proposal's constitution assessment
(Principle I: Autonomous Collaboration) -- the entire
pipeline should operate autonomously, not just the
later steps.

### D2: Guardrail uses existing format

The new guardrail will follow the established
`**NEVER/ALWAYS verb**` format used by the existing 8
guardrails. It will be placed as the first guardrail
in the section since autonomy is the command's primary
design property.

### D3: Checkpoint transition instructions are additive

The existing checkpoint text ("Mark Step N complete in
the execution checklist before proceeding") is retained
unchanged. New transition instructions are added as
additional lines after the checkpoint, following the
same blockquote format. This preserves the checkpoint's
original purpose (execution tracking) while adding
behavioral guidance.

### D4: Both files must stay in sync

The command exists in two locations:
- `internal/scaffold/assets/opencode/commands/uf.unleash.md`
  (canonical source embedded in the binary)
- `.opencode/commands/uf.unleash.md` (deployed copy)

Both files MUST receive identical changes. The scaffold
drift detection tests verify this synchronization.

## Risks / Trade-offs

### Risk: LLM non-determinism

The fix is a prompt engineering change. LLM behavior is
non-deterministic -- adding "do not ask for confirmation"
instructions makes spurious halts less likely but cannot
guarantee elimination. This is an inherent limitation of
prompt-based behavioral control.

**Mitigation**: The guardrail + inline instruction
combination follows the proven `inline-stop-instructions`
pattern, which has been effective for the inverse problem
(preventing agents from continuing past boundaries).

### Risk: Over-indexing on autonomy

Adding strong "never pause" language could theoretically
reduce an agent's willingness to exit at legitimate safety
gates.

**Mitigation**: The guardrail explicitly enumerates the
valid exit points (HIGH/CRITICAL spec findings, build
failures, merge conflicts, 3 review iterations). The
transition instructions are scoped to inter-step
boundaries only, not intra-step decision points. Each
step's internal exit logic remains unchanged.

### Trade-off: Consistency vs. minimal change

Auditing all 11 checkpoints (D1) increases the change
size compared to fixing only the 3 checkpoints identified
in the issue. This trades minimal diff for consistency --
preventing the same bug from appearing at other
transitions later.
