## Context

The `/uf.unleash` command template (661 lines) is injected as
conversation content in OpenCode. When context compression is
enabled, the compression system can discard procedural instructions
between pipeline steps, causing the agent to lose awareness of its
current execution state, phase boundaries, fix loop iteration counts,
and parallel worker batch progress (issue #380).

Issue #373 describes the same root cause for `/uf.review-pr` and
proposes a three-part remediation pattern. This design applies that
same pattern to `/uf.unleash`, adapted for its 8-step pipeline
structure with phases, parallel workers, and fix loops.

## Goals / Non-Goals

### Goals
- Survive context compression events without losing pipeline state
- Maintain awareness of current step, phase, and iteration count
  after compression fires
- Ensure the agent re-reads the template on resume rather than
  inferring procedure from compressed summaries
- Keep filesystem markers (checkboxes, HTML comment markers) as the
  authoritative resumability source
- Apply a consistent pattern with the `/uf.review-pr` fix (#373)

### Non-Goals
- Restructuring `/uf.unleash` into parent/subagent split (that is the
  approach proposed for `/uf.review-pr` but is a separate effort)
- Reducing the template size to avoid triggering compression (the
  template must remain comprehensive for the pipeline to function)
- Modifying OpenCode's compression behavior itself
- Changing any pipeline logic, step ordering, or exit conditions

## Decisions

### D1: Three-part remediation pattern

Apply the same three-part pattern proposed in issue #373:

1. **Session-resume guard** (blockquote at top of Instructions)
2. **Execution checklist** (inline state updated via Edit tool)
3. **Step-level checkpoint reminders** (one-liner at each boundary)

**Rationale**: Consistency with the `/uf.review-pr` fix means the
pattern is recognizable across commands. The agent learns one
resilience pattern and applies it uniformly.

### D2: Execution checklist placement

Place the execution checklist immediately after the session-resume
guard blockquote, before Step 0 (Startup Cleanup). The checklist
tracks:

- Current step (0-8) with step name
- Current phase within Step 5 (e.g., Phase 2/3)
- Fix loop iteration for Steps 4 and 6 (e.g., iteration 1/3)
- Parallel worker batch progress (e.g., batch 1/2, 3/4 workers done)

**Rationale**: Placing the checklist early in the template means it
survives even aggressive compression that preserves only the first
portion of the content. The Edit tool instruction ensures the agent
actively maintains state rather than passively relying on context.

### D3: Checkpoint reminder format

Each step's final paragraph includes a one-line checkpoint reminder:

```
> CHECKPOINT: Mark Step N complete in the execution checklist
> before proceeding.
```

Phase boundaries within Step 5 include:

```
> CHECKPOINT: Update execution checklist -- Phase N/M complete.
```

Fix loop iterations in Steps 4 and 6 include:

```
> CHECKPOINT: Update execution checklist -- iteration N/3.
```

**Rationale**: Short, formulaic reminders are less likely to be
compressed away than longer prose. The `>` blockquote format
visually distinguishes checkpoints from regular instructions.

### D4: Filesystem markers remain authoritative

The session-resume guard explicitly states that only filesystem
markers are authoritative for resumability:

- Task checkboxes (`[x]` vs `[ ]`) in `tasks.md`
- HTML comment markers (`<!-- spec-review: passed -->`,
  `<!-- code-review: passed -->`)

The execution checklist is a conversation-level aid, not a
replacement for filesystem state. On re-run, the agent MUST
re-probe filesystem markers per Step 2 (Resumability Detection)
regardless of what the execution checklist says.

**Rationale**: Filesystem markers persist across sessions. The
execution checklist exists only within a single conversation and
is designed to survive intra-session compression, not inter-session
continuity.

### D5: Both canonical and scaffold copies updated

Both files must be updated in sync:
- `.opencode/commands/uf.unleash.md` (canonical)
- `internal/scaffold/assets/opencode/commands/uf.unleash.md` (scaffold)

Existing drift detection tests verify these match.

**Rationale**: The scaffold copy is what `uf init` deploys to new
projects. Drift between canonical and scaffold is caught by existing
tests, but both must be updated in the same PR to avoid test failures.

## Risks / Trade-offs

### R1: Template size increase

Adding the guard, checklist, and checkpoint reminders will increase
the template from ~661 lines to ~700-720 lines. This slightly
increases the probability of compression firing, but the added
content is specifically designed to survive compression.

**Mitigation**: The additions are concise. The checklist is a compact
table. Checkpoint reminders are single lines.

### R2: Agent compliance with Edit tool instructions

The execution checklist relies on the agent actually using the Edit
tool to update it. If the agent ignores the instruction, the checklist
becomes stale and provides no value.

**Mitigation**: The session-resume guard prominently instructs the
agent to maintain the checklist. Checkpoint reminders at each step
boundary reinforce this. The pattern is already proposed for
`/uf.review-pr`, so agents will encounter it consistently.

### R3: No structural guarantee

This is a behavioral mitigation (instructing the agent differently),
not a structural one (like the parent/subagent split proposed in
#373). Compression behavior is ultimately controlled by OpenCode,
and sufficiently aggressive compression could still discard the
guard and checklist.

**Mitigation**: The guard is placed at the very top of the
Instructions section. The checklist follows immediately. Both are
formatted as blockquotes, which compression systems may treat
differently from regular prose. The structural fix (parent/subagent
split) is a separate, complementary effort.
