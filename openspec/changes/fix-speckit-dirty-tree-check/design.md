## Context

The speckit specify command (`speckit.specify.md`) includes a
dirty-tree check at lines 40-50 that instructs agents to stop and
ask the user for confirmation when uncommitted changes are detected
before `git checkout -b`. However, this check is expressed entirely
in prose with no structured tool call, making it vulnerable to
context compression (T1+T3 weakness pattern from audit #346).

The proposal (proposal.md) identifies this as a hardening fix with
PASS alignment on Observable Quality and Security by Default
principles.

## Goals / Non-Goals

### Goals
- Replace prose-only dirty-tree guard with an explicit
  `AskUserQuestion` tool call that presents structured options
- Match the established pattern already used elsewhere in speckit
  commands (e.g., step 1 uses `AskUserQuestion` for feature
  description input)
- Ensure the guard is resistant to context compression by agents

### Non-Goals
- Modifying the branch numbering or naming logic (steps 3-4)
- Fixing sibling issues #350 (openspec-propose SKILL.md) or #353
  (opsx-propose.md) -- those are tracked separately
- Fixing `speckit-workflow/SKILL.md` which contains a parallel
  prose-only dirty-tree guard -- a follow-up issue should be filed
- No scaffold asset sync is required -- `speckit.specify.md` is a
  non-embedded file (created by `specify init`, not scaffolded by
  `uf init`)
- Adding automated enforcement beyond agent instructions (e.g., no
  git hooks or CI checks for this pattern)
- Changing the exception behavior (user explicitly requesting a new
  spec in the same message)

## Decisions

### D1: Use AskUserQuestion with two structured options

Replace the prose "STOP and ask the user for confirmation" with an
explicit `AskUserQuestion` tool call. The two options are:

1. **"Stash changes and continue"** -- proceed with branch creation
2. **"Abort -- keep changes as-is"** -- stop the workflow

This matches the fix described in issue #358 and provides a clear,
unambiguous decision point that agents cannot skip through
compression.

**Rationale**: Two options cover the practical choices a user has
when uncommitted work is detected. "Stash changes" implies the
agent should run `git stash` before proceeding. "Abort" stops the
workflow entirely. Adding more options (e.g., "commit first") would
expand scope beyond the fix.

### D2: Preserve the exception clause

The existing exception ("only skip this check if the user explicitly
said to create a new spec in the same message") is retained as-is.
This exception is already a conditional check that agents can
evaluate before reaching the tool call.

### D3: Show uncommitted file list in the question context

The `AskUserQuestion` call should include the output of
`git status --short` in its context so the user can make an informed
decision. This aligns with Observable Quality -- the user sees
exactly what uncommitted work exists.

## Risks / Trade-offs

### Low Risk: Behavioral change for agents already following the prose
Agents that were already correctly interpreting the prose instruction
will now see a structured tool call instead. The behavior is
functionally identical but the mechanism changes. No user-facing
impact expected.

### Accepted Trade-off: Stash vs. manual management
The "Stash changes and continue" option implies `git stash` will be
run by the agent. If the user has complex uncommitted work, stashing
may not be the ideal approach. However, this matches the simplicity
principle -- users who need more control can abort and manage their
working tree manually. If `git stash` fails (non-zero exit), the
agent aborts the workflow. Upon successful stash and workflow
completion, the agent notifies the user that their changes can be
restored with `git stash pop`. Stash recovery is the user's
responsibility -- the agent does not auto-restore.
