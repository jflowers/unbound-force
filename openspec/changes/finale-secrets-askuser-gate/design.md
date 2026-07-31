## Context

The `/uf.finale` command (Step 2) scans for potential secret
files before staging changes with `git add .`. When secret
files are detected, the command instructs the agent to "ask for
confirmation" using prose text. This is a T3 weakness: the
confirmation is not enforced by a tool call, so agents under
context compression may skip it and stage secrets.

The sibling push gate (Step 4, line 175) was already fixed in
PR #405 by replacing prose with an explicit AskUserQuestion
tool call. This design applies the identical pattern to the
secrets check gate.

## Goals / Non-Goals

### Goals

- Replace the prose confirmation at lines 80-81 with an
  explicit AskUserQuestion tool call that blocks execution
- Match the established pattern from the push gate (line 175)
- Keep both file copies in sync (command file and scaffold
  asset)

### Non-Goals

- Changing the secret file detection logic or patterns
- Adding new secret file patterns to the scan list
- Modifying any other confirmation gates in `/uf.finale`
- Changing the push gate (already fixed)
- Modifying Go source code or tests beyond drift detection

## Decisions

### D1: Use binary AskUserQuestion options

The AskUserQuestion tool call will present exactly two options:

1. "Yes -- stage all files and continue"
2. "No -- stop here"

**Rationale**: This matches the push gate pattern at line 175
which uses two options (`"Push to remote"` /
`"Abort -- keep commits local"`). Binary options eliminate
ambiguity and prevent agents from interpreting a third option
as permission to proceed.

### D2: Add explicit STOP instruction on decline

When the user selects "No", the command MUST include an
explicit `STOP. Do not run git add .` instruction.

**Rationale**: The push gate fix (line 182) uses the same
pattern: `report error and **STOP**. Do not proceed to
Step 5 or any subsequent steps.` Explicit stop instructions
prevent agents from treating the decline as a soft suggestion.

### D3: Both files updated identically

The command file (`.opencode/commands/uf.finale.md`) and the
scaffold asset (`internal/scaffold/assets/opencode/commands/
uf.finale.md`) MUST receive identical changes.

**Rationale**: These files share the same hash (`A26164A968`)
and existing drift detection tests verify they stay in sync.
Updating only one would break the drift test.

### D4: Preserve the warning message block

The existing warning message (lines 71-78) is well-structured
and informative. It MUST be preserved as-is. Only the
confirmation mechanism (lines 80-81) changes.

## Risks / Trade-offs

### Risk: Line number drift

The issue references line 80 based on the current file state.
If another PR merges before this change, line numbers may
shift.

**Mitigation**: The implementation task will use content
matching (the specific prose text "Ask for confirmation")
rather than line numbers to locate the edit target.

### Trade-off: No automated enforcement

This change relies on the agent's instruction-following
behavior. A truly hardened gate would require runtime
enforcement (e.g., a pre-commit hook that blocks `.env`
files). However, that is out of scope for this change and
would require a separate spec.

**Accepted**: The AskUserQuestion tool call is the strongest
gate available within the slash command instruction layer,
and matches the pattern already approved for the push gate.
