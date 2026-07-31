## Context

The `/uf.finale` command is the longest slash command in the
repository (869 lines). It orchestrates an 8-step workflow:
branch gate, staging, commit, push, PR creation, CI watch,
return to main, and summary. When OpenCode's context
compression fires mid-execution, the procedural instructions
are summarized and critical gates are lost.

Issue #373 identified the same root cause in `/review-pr`
and PR #371 fixed it with a three-part pattern: session-resume
guard, mandatory gate markers, and AskUserQuestion enforcement.
This design applies the same proven pattern to `/uf.finale`.

## Goals / Non-Goals

### Goals
- Preserve critical workflow state (branch name, commit hash,
  PR number, PR URL, selected options) across compression
  events
- Protect all four identified failure modes: PR body approval
  (Step 5f), conflict recovery (Step 6b), secrets check
  (Step 2), CI watch (Step 6)
- Follow the exact pattern established in PR #371 for
  consistency across commands
- Keep both copies in sync: `.opencode/commands/uf.finale.md`
  and `internal/scaffold/assets/opencode/commands/uf.finale.md`

### Non-Goals
- Fixing the prose-only secrets gate (#347) -- that is a
  separate issue about replacing prose with AskUserQuestion,
  not about compression resistance
- Fixing the push gate (#348) -- already fixed by PR #405
- Changing the workflow steps or their ordering
- Reducing the file's line count

## Decisions

### D1: Three-part compression guard pattern

Apply the same three-part pattern from PR #371:

1. **Session-resume guard** at the top of the Instructions
   section (before Step 1). A blockquote instructing the
   agent to re-read the template on session resume and not
   trust compressed summaries for gate completion.

2. **Execution checklist** immediately after the session-resume
   guard. A plain-text checklist the agent MUST maintain
   using the Edit tool. The checklist preserves key state:
   ```
   BRANCH=<set when known>
   COMMIT=<set when known>
   PR_NUMBER=<set when known>
   PR_URL=<set when known>
   CONFLICT_OPTION=<set when known>
   ```
   Each step has a checkbox `[ ]` that the agent marks `[x]`
   on completion.

   **Rationale**: The Edit tool writes to a persistent file,
   making the checklist survive compression. The agent can
   re-read it to recover state.

3. **Step-level checkpoint reminders** at the end of each
   critical step (Steps 2, 3, 4, 5f, 5g, 6, 6b, 7, 8).
   A one-line reminder:
   ```
   **Checkpoint**: Update the execution checklist before
   proceeding.
   ```

### D2: Mandatory gate markers on all user-facing gates

Wrap each user-facing confirmation gate with visual markers:

```
>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<
...gate content...
>>> END MANDATORY GATE <<<
```

Apply to:
- Step 2: Secrets check confirmation
- Step 5f: PR body approval
- Step 6b: Conflict recovery option selection
- Step 6 (CI failure): CI failure option selection

### D3: Session-resume guard placement

Place the session-resume guard between the `## Instructions`
heading and Step 1. This ensures it is read first on any
session resume, before the agent attempts to continue
mid-workflow.

### D4: Scaffold copy sync

Both files MUST contain identical content. The existing drift
detection test (`TestAssetDrift` or equivalent) already
verifies this. No new test infrastructure is needed.

## Risks / Trade-offs

### R1: Increased file length (~40-60 lines)

The guards add approximately 40-60 lines to an already
869-line file. This is acceptable because:
- The guards are structural, not prose
- They serve a security function (preventing gate bypass)
- The alternative (no guards) has documented failure modes

### R2: Checklist maintenance overhead

The agent must maintain the checklist via Edit tool calls,
adding one tool call per step. This is acceptable because:
- The Edit tool calls are trivial (single-line changes)
- The state preservation benefit outweighs the overhead
- The same pattern works successfully in `/review-pr`

### R3: Pattern divergence risk

If the compression guard pattern evolves in `/review-pr`,
`/uf.finale` must be updated to match. This is mitigated by:
- Both files following the same three-part structure
- The pattern being simple and well-documented
- Future changes can be applied to both files together
