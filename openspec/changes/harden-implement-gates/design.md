## Context

The `speckit.implement` command
(`.opencode/commands/speckit.implement.md`) contains two gates
that rely on prose instructions to stop agent execution. Issue
#346 demonstrated that prose-only gates are bypassed under
context compression — the review-pr command's Step 11
confirmation gate was skipped when a session was resumed from
compressed context. The same vulnerability class applies to
both gates in speckit.implement.

The proven fix pattern, already applied to review-pr and
review-council, is to replace prose instructions with explicit
AskUserQuestion tool calls that mechanically force the agent
to pause and wait for user input.

## Goals / Non-Goals

### Goals
- Replace the checklist incomplete gate (lines 38-47) with an
  AskUserQuestion tool call using explicit options
- Replace the commit/push gate (lines 136-151) with an
  AskUserQuestion tool call that blocks next-step suggestions
- Follow the same hardening pattern used in review-pr (Step 11)
  and review-council for consistency across the command suite
- Add session-resume guard language to both gates

### Non-Goals
- Refactoring or restructuring other parts of
  speckit.implement.md
- Adding new gates beyond the two identified in issue #357
- Modifying any other speckit commands (specify, plan, tasks,
  etc.) — those are separate issues if needed
- Adding automated testing for command file gate presence
  (that would be a separate tooling change)
- Scaffold asset sync — `speckit.implement.md` does not have
  a corresponding scaffold asset under
  `internal/scaffold/assets/`, so no sync is needed

## Decisions

### D1: Use AskUserQuestion with explicit options (not open-ended)

Both gates will use AskUserQuestion with predefined options
rather than open-ended prompts. This ensures:
- The agent cannot interpret a user response creatively to
  bypass the gate
- The options clearly convey the consequences of each choice
- The pattern matches review-pr and review-council

**Gap A options**: `["Proceed anyway", "Stop -- fix checklists first"]`

**Gap B options**: `["Yes -- all committed and pushed",
"Not yet -- let me commit first"]`

### D2: Add CRITICAL RULE enforcement language

Each gate will include a CRITICAL RULE block (matching the
review-pr pattern at line 949) that explicitly states the gate
MUST use AskUserQuestion and cannot be skipped under any
circumstances, including session resumption or context
compression.

### D3: Preserve existing gate logic, only change enforcement

The checklist scanning logic (steps 2.18-2.47) and the
commit/push verification logic (step 10) remain unchanged.
Only the enforcement mechanism changes from inline prose to
tool calls.

### D4: Commit/push gate checks git status before prompting

The commit/push gate will continue to run `git status --short`
first. If the working tree is clean and changes are pushed,
the gate passes automatically. The AskUserQuestion is only
triggered when uncommitted changes are detected.

## Risks / Trade-offs

### Low risk: Additional user prompts

Both gates already intended to stop and ask the user. The
change makes the stops mechanical rather than optional. Users
who previously benefited from agents skipping these gates
(unlikely to be intentional) will now always be prompted.

### Accepted trade-off: No automated verification

There is no automated test that verifies AskUserQuestion tool
calls exist at specific locations in command files. This is
accepted because:
- Command files are Markdown instructions, not executable code
- The fix is verified by manual review during PR
- Automated verification would require a separate tooling
  effort (out of scope)
