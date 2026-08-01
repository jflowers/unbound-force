## Context

The `/uf.address-feedback` command (496 lines) runs a four-phase
sequential workflow: Ingest, Assess, Triage, Execute. The workflow
spans many tool calls, making it vulnerable to OpenCode's context
compression firing between phases.

The existing crash-recovery cache (`state.json`) persists assessment
results after Phase 2 but does not persist Phase 3 triage decisions.
Phase 3 decisions are accumulated in-context via interactive
AskUserQuestion calls and consumed as a batch in Phase 4. This
in-context-only state is the primary vulnerability.

Issue #373 proposed the same three-part remediation for
`/uf.review-pr`. The review-pr command currently has a
session-resume guard at its Step 11 posting gate (line 846) but
does not yet have the execution checklist or checkpoint reminders.
This change applies the full pattern to address-feedback first.

## Goals / Non-Goals

### Goals
- Protect Phase 3 triage decisions from compression loss by
  making them observable in a persistent checklist
- Prevent Phase 4.5 posting gate bypass when compressed context
  is treated as prior authorization
- Prevent Phase 4.3 review-council state loss (iteration count,
  pass/fail constraint) during compression
- Follow the same remediation pattern proposed in #373 for
  consistency across commands

### Non-Goals
- Persisting triage decisions to `state.json` (cache format
  change is a larger scope change tracked separately)
- Restructuring the command as a parent/subagent split (the
  alternative approach from #373, deferred)
- Applying the same guards to `/uf.review-pr` (separate issue
  #373, separate change)
- Preventing compression from firing (that is an OpenCode
  platform concern, not a command-level fix)

## Decisions

### D1: Three-part guard structure

Apply the three mechanisms proposed in #381:

1. **Session-resume guard** (blockquote, top of file) -- instructs
   the agent to re-read the full template on resume, and to treat
   only `state.json` as authoritative for item state. Compressed
   context summaries MUST NOT be used to infer phase completion or
   triage decisions.

2. **Execution checklist** (markdown checklist, placed after the
   preamble before Phase 1) -- a live checklist the agent updates
   in-place using the Edit tool. Includes:
   - Phase completion markers (`[ ] Phase 1: Ingest`)
   - Running triage decision counts in Phase 3 line
     (e.g., `[x] Phase 3: Triage -- 4/6: 2A 1M 1R`)
   - Review-council iteration count in Phase 4.3 line
   - Comment posting count in Phase 4.5 line

3. **Step-level checkpoint reminders** (one-liner at end of each
   phase section) -- reminds the agent to update the checklist
   before proceeding. Pattern:
   `> CHECKPOINT: Update the execution checklist before
   > proceeding to Phase N+1.`

**Rationale**: This is the lightest-weight approach that makes
critical state observable and recoverable without changing the
workflow structure or cache format. The checklist acts as a
secondary persistence mechanism that the agent can read back
after compression.

### D2: Checklist lives in the command output, not the file

The checklist is rendered as agent output at the start of
execution, not embedded statically in the command template. The
agent writes it to its output and then uses the Edit tool to
update it in-place as phases complete. This keeps the checklist
co-located with the execution context.

**Rationale**: The command template is a static instruction file.
Dynamic state (which items were triaged, what decisions were made)
belongs in the agent's output where the Edit tool can modify it.

### D3: Phase 4.5 posting gate references checklist

The existing posting gate (AskUserQuestion confirmation before
posting reply comments) is hardened with an additional instruction:
the agent MUST verify that the checklist shows Phase 3 as complete
with all items decided AND Phase 4.1-4.4 as complete before
presenting comments for posting. If the checklist is missing or
incomplete, the agent MUST re-read the template and rebuild state
from `state.json` and the git log.

**Rationale**: Same pattern as #346/#373 for the review-pr APPROVE
gate. The checklist provides a verifiable pre-condition that cannot
be fabricated from compressed context.

### D4: Scaffold copy must be updated in lockstep

Both `.opencode/commands/uf.address-feedback.md` and
`internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
MUST be identical. Existing drift detection tests enforce this.

**Rationale**: The scaffold copy is what `uf init` writes to new
projects. If only the command file is updated, new projects would
not get the compression guards.

## Risks / Trade-offs

### R1: Template size increase (~30-40 lines)
The command grows from 496 to ~530-540 lines. This slightly
increases the initial context consumption but is a net positive:
the guards prevent the much larger cost of re-running Phase 3
from scratch after compression.

### R2: Edit tool reliability
The checklist update mechanism depends on the agent correctly
using the Edit tool to modify its own output. If the agent fails
to update the checklist, the guards degrade gracefully -- the
session-resume guard and checkpoint reminders still provide
defense-in-depth.

### R3: Does not protect against all compression scenarios
If compression fires mid-Phase-3 (between individual triage
decisions), the checklist will show partial progress but the
specific per-item decisions already made may still be lost from
context. The checklist's running count (e.g., "3/6 decided")
tells the agent where to resume but not what the prior decisions
were. Full protection would require persisting decisions to
`state.json` (out of scope -- see Non-Goals).
