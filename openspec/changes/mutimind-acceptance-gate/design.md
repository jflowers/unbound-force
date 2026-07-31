## Context

The `muti-mind-po.md` agent file instructs Muti-Mind to invoke `go run cmd/mutimind/main.go decide ...` to record acceptance decisions. This CLI command writes an irreversible governance artifact. Currently, the agent can invoke it without user confirmation. The "Interactive Approval" rule at line 60 only covers the `add` (story generation) command, leaving the `decide` command unprotected.

Sibling fixes for other agents and commands (PRs #391-#408) have established a consistent pattern: an AskUserQuestion gate before any irreversible CLI invocation. This design follows that established pattern.

## Goals / Non-Goals

### Goals
- Add an AskUserQuestion confirmation gate before the `decide` CLI command in `muti-mind-po.md`
- Match the confirmation pattern established by the existing "Interactive Approval" rule for story generation
- Present decision details (backlog item ID, decision type, rationale) for informed user confirmation

### Non-Goals
- Modifying the Go backend (`cmd/mutimind/main.go`) -- the CLI interface remains unchanged
- Adding confirmation gates to other Muti-Mind commands (e.g., `generate-artifact`) -- out of scope for this change
- Changing the acceptance-decision schema or artifact format
- Adding automated tests for agent instruction behavior

## Decisions

### D1: Inline instruction text, not a separate skill

The confirmation gate will be added as inline instruction text within the "Acceptance Authority" section of `muti-mind-po.md`, following the same pattern as the "Interactive Approval" rule at line 60. A separate skill file is unnecessary for a single confirmation step.

**Rationale**: The existing pattern for story generation confirmation is inline (line 60). Consistency with existing patterns reduces cognitive load and keeps the agent file self-contained (Composability First -- the agent remains independently understandable).

### D2: Present three data points in the confirmation

The AskUserQuestion prompt will include:
1. Target backlog item ID (e.g., `BI-NNN`)
2. Proposed decision (`accept`, `reject`, or `conditional`)
3. Rationale summary

**Rationale**: These are the minimum context needed for an informed confirmation. They map directly to the `--item`, `--decision`, and `--rationale` CLI flags, so the user sees exactly what will be recorded.

### D3: Two-option confirmation ("Confirm decision" / "Abort")

The gate uses a binary choice matching the pattern established by sibling fixes (PRs #391-#408).

**Rationale**: Acceptance decisions are final. There is no "edit and retry" path -- if the user wants to change parameters, they should abort and re-invoke the command with different inputs.

## Risks / Trade-offs

### R1: Additional interaction step

Adding a confirmation gate adds one user interaction per acceptance decision. This is acceptable because acceptance decisions are infrequent (one per backlog item evaluation) and the governance value outweighs the friction.

### R2: Agent instruction compliance

Agent instruction compliance is probabilistic -- the agent may occasionally skip the gate under context pressure. This is a known limitation of instruction-based guardrails and is consistent with how all other confirmation gates in the swarm operate. The Go backend itself does not enforce confirmation; the gate exists at the agent instruction layer.
