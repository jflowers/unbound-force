## Context

The `/opsx-archive` workflow has two entry points — the command
file (`.opencode/commands/opsx-archive.md`) and the skill file
(`.opencode/skills/openspec-archive-change/SKILL.md`). Both
have two structural gaps identified in issue #356:

1. The "Return to main branch" step performs `git checkout main`
   without user confirmation
2. In the "Perform the archive" step, the `mv` command block
   appears as a visually separate, unconditional code fence
   after the target-exists check, making the conditional
   relationship ambiguous

These gaps follow the same class of issue found in issue #346
(review-pr confirmation gate bypass). The fix applies the
established hardening pattern: mandatory `AskUserQuestion`
gates before state-changing operations, and explicit guard
structure for conditional commands.

## Goals / Non-Goals

### Goals
- Add an `AskUserQuestion` confirmation gate before
  `git checkout main` in both the command file and skill file
- Make the conditional relationship between the target-exists
  check and the `mv` command explicit in both files
- Maintain consistency with the guard patterns used in
  `/opsx-propose` (dirty tree check, branch check)

### Non-Goals
- Adding new archive functionality
- Modifying other commands (those have separate issues)
- Adding programmatic tests for command files (these are
  agent instruction files, not executable code)
- Changing the archive directory structure or naming
- Adding a dirty-tree check before the branch switch (the
  SKILL.md already has a "Commit and push all changes" step;
  the command file does not, but adding one is a separate
  concern from the confirmation gate)

## Decisions

### D1: AskUserQuestion with two options for branch switch

The confirmation gate will use `AskUserQuestion` with two
explicit options: "Return to main" and "Stay on branch".
This matches the pattern proposed in issue #356 and gives
the user a clear choice rather than a yes/no prompt.

**Rationale**: Binary yes/no prompts are ambiguous in context.
Named options make the action explicit and reduce
misinterpretation risk.

### D2: Clarify conditional nesting, not restructure

The target-exists check already precedes the `mv` command block
in both files. The issue is that the `mv` code fence appears as
a standalone instruction after the check text, and an agent
could interpret it as unconditional. The fix adds explicit
conditional language before the code fence (e.g., "If the
target does not exist, execute:") to make the guard relationship
unambiguous. The step will not be split into sub-steps.

**Rationale**: The ordering is correct; only the association
between the guard and the command is ambiguous. Adding explicit
conditional language is a minimal change that makes the intent
clear without restructuring.

### D3: No changes to the guardrails section

The existing guardrails at the end of `opsx-archive.md` are
adequate. The new confirmation gate is a procedural step, not
a guardrail principle.

**Rationale**: Guardrails describe invariants. The branch
switch confirmation is a specific procedural gate within
the step sequence.

## Risks / Trade-offs

### Risk: Agent may treat options as decorative

The `AskUserQuestion` gate depends on the agent correctly
pausing execution and waiting for user input. Issue #346
showed that agents can skip gates under compressed context.

**Mitigation**: The fix in issue #346 added session-resume
guard language to `/review-pr`. This change uses the same
`AskUserQuestion` tool pattern, which has clearer tool-call
semantics than inline text gates.

### Trade-off: Additional user friction

Adding a confirmation prompt adds one interaction to the
archive flow. This is acceptable because branch switches
are infrequent (once per archive) and the cost of an
unintended switch is higher than the cost of a prompt.
