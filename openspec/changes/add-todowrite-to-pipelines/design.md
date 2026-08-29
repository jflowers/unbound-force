## Context

Pipeline commands use an embedded execution checklist maintained
via the Edit tool. This checklist survives context compression
and serves as the authoritative resumability record. However, the
checklist is invisible to the user in real-time — only the Edit
tool and the agent see it. The TodoWrite tool provides live UI
visibility but is not used by any pipeline command except
`/opsx-propose`.

The two mechanisms serve complementary purposes:

| Mechanism | Purpose |
|---|---|
| Edit tool checklist | Resumability after context compression |
| TodoWrite | Real-time visibility for the user in the session UI |

## Goals / Non-Goals

### Goals
- Add TodoWrite instructions to all 4 affected pipeline commands
- Establish a consistent pattern for how TodoWrite and Edit tool
  checklists coexist
- Keep the change minimal — insert instructions, do not
  restructure existing command logic

### Non-Goals
- Replacing the Edit tool checklist with TodoWrite (they serve
  different purposes and both are needed)
- Modifying the step logic or execution flow of any command
- Adding TodoWrite to non-pipeline commands (commands without
  embedded execution checklists)
- Changing the replicator scaffold templates (this change targets
  the command files in this repo; replicator sync is a separate
  concern)

## Decisions

### D1: Instruction placement — top of Instructions section

**Decision**: Add a TodoWrite instruction block immediately after
the session-resume guard and execution checklist in each command,
before the first step begins.

**Rationale**: The agent needs to initialize the TodoWrite list
before executing any steps. Placing the instruction at the top
ensures it is read and acted upon before the pipeline begins.
The pattern extends the lightweight TodoWrite usage in `/opsx-propose`
(step 5a) with explicit initialization, status transitions, and
resume behavior.

### D2: TodoWrite items mirror the execution checklist steps

**Decision**: The TodoWrite items MUST correspond 1:1 with the
execution checklist steps. Each checklist item becomes a
TodoWrite item with the same name.

**Rationale**: Maintaining a single source of truth for step
names avoids drift between the two mechanisms. The agent reads
the execution checklist to know what steps exist, then
initializes TodoWrite from the same list.

### D3: Instruction format — a self-contained instruction block

**Decision**: Add a clearly delimited instruction block that
tells the agent to:
1. Initialize TodoWrite at pipeline start with all steps as
   `pending`
2. Mark each step `in_progress` before starting, `completed`
   after finishing
3. Continue using the Edit tool checklist for resumability

**Rationale**: A self-contained block is easier to maintain and
audit than scattered inline instructions at each step. The
command template activates the TodoWrite pattern explicitly,
ensuring agents use it consistently across all pipeline commands.

### D4: TodoWrite re-initialization on resume

**Decision**: When resuming from compressed context, the agent
SHOULD re-initialize TodoWrite from the execution checklist
state (marking already-completed steps as `completed`). This
avoids stale TodoWrite state from a previous session.

**Rationale**: TodoWrite is session-local and does not survive
context compression. On resume, the execution checklist is the
authority. Re-initializing TodoWrite from it ensures the UI
reflects the true state.

## Risks / Trade-offs

### R1: Instruction bloat

Adding ~15 lines of TodoWrite instructions to each command
increases template size. This is acceptable because (a) the
instructions are formulaic and can be a small self-contained
block, and (b) the benefit (live user visibility) directly
addresses a user-reported issue.

### R2: Agent compliance

The instructions rely on agent compliance — there is no
enforcement mechanism for TodoWrite usage. However, the same
is true of the Edit tool checklist instructions, and agents
follow those consistently. Adding explicit instructions is the
established pattern for agent behavior in this project.

### R3: Replicator sync

These command files are propagated by `replicator init`. Updating
them here means the next `replicator init` run will propagate
the changes. This is the intended flow — changes land in this
repo first, then propagate via scaffold sync. No special
coordination is needed.
