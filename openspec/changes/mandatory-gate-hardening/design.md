## Context

The `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<` pattern
is established in the codebase as the structural mechanism that
prevents agents from executing mutations without human consent.
It works because agents in compressed-context sessions treat the
`>>>` markers as hard stop signals, unlike prose instructions
which can be read past.

Three commands already use the pattern correctly at some entry
points: `uf.review-council.md` (Step 7f — review posting),
`uf.review-pr.md` (review posting), `uf.finale.md` (Steps 2,
5, 6, 6b). However, an audit (issue #474) found 7 distinct unguarded mutation
entry points across 4 commands, consolidated into 5 new gates
(FR-001 through FR-005) after design decisions D3 and D6.

## Goals / Non-Goals

### Goals
- Wrap all unguarded mutation entry points in the formal
  `>>> MANDATORY GATE <<<` / `>>> END MANDATORY GATE <<<`
  marker pair
- Include the session-resume guard in every new gate
- Preserve all existing gates unchanged
- Maintain consistency with the established pattern

### Non-Goals
- Modifying the gate pattern itself (no new marker syntax)
- Adding gates to non-mutation steps (e.g., read-only analysis)
- Gating the fix-branch push in `uf.review-pr` — this is a
  user-executed action (the agent provides commands as guidance
  text; line 857 explicitly prohibits agent-executed push),
  not an agent mutation
- Refactoring command file structure or workflow phases
- Changing severity classifications from the issue audit

## Decisions

### D1: Gate Placement Within Existing Workflow Steps

Gates are inserted at the entry point of the mutation, wrapping
the existing question tool invocation and its options. The gate
does NOT replace existing logic — it adds the structural
markers and session-resume guard around the existing
confirmation flow.

Rationale: Minimizes diff size. The existing question tool
patterns already have the right options; they just lack the
structural `>>>` markers and resume guard.

### D2: Session-Resume Guard Phrasing

Every new gate uses identical resume guard phrasing from the
gold standard (uf.review-council.md Step 7f), adapted for
the specific mutation context:

```
**Session-resume guard**: If this session was resumed
from compressed context, or if you cannot verify that
the human explicitly confirmed <the specific action> in
the current uncompressed conversation history, you MUST
re-present <the relevant content> and obtain fresh
confirmation via the **question tool** before proceeding.
Do NOT rely on confirmation recorded in compressed context.
When in doubt, re-confirm — false re-confirmation is
harmless; <executing the action> without consent is a
violation.
```

Rationale: The resume guard is the critical piece that
prevents compressed-context bypass. Using consistent
language ensures agents trained on any of these commands
recognize the pattern.

### D3: Consolidated Phase 4 Entry Gate for address-feedback

Rather than gating each sub-step (4.1, 4.2, 4.4, 4.5, 4.6)
individually, place a single gate at the Phase 4 entry point
that summarizes the queued actions and their risk levels. The
user reviews the full execution plan before any mutations begin.

Rationale: Multiple sequential gates within a single phase
would create friction without proportionate safety benefit.
The Phase 4 work is a batch — the user should approve or
reject the batch, not each item individually. Individual
sub-steps still have their own checkpointing but not
separate confirmation gates.

### D4: Commit Preview Gate for review-pr Fix Branch

Add a gate before the `git commit` at Step 6, sub-step 6
(commit). The existing branch creation already has user
confirmation via question tool, but the commit itself has
no content preview showing what the AI-generated fix contains.

Rationale: The fix branch workflow has the user approve
branch creation, but then the agent writes code and commits
without showing the diff. The commit gate shows the staged
diff and commit message before committing AI-generated code.

### D5: Spec File Edit Gate for review-council

Add a gate before the auto-fix loop (Step 8, item 3) where
LOW/MEDIUM spec findings are auto-applied. The existing prose
says "apply these fixes directly to the spec files" with no
stop point.

Rationale: Even LOW/MEDIUM severity spec edits alter the
contractual specification files. The auto-fix policy is sound,
but the entry point needs a structural gate so the user can
review what will be auto-fixed before it happens.

### D6: Commit and Push Gates for finale Steps 3 and 4

Step 3 already uses the question tool to show the proposed
commit message, but lacks `>>> MANDATORY GATE <<<` markers
and a session-resume guard. Step 4 already uses the question
tool for push confirmation, but also lacks markers and a
resume guard.

Rationale: Both steps have the right interactive flow but
lack structural protection. Adding markers and resume guards
makes them resistant to compressed-context bypass.

## Risks / Trade-offs

### R1: Increased Interactive Friction

Adding 5 new gates means 5 additional confirmation prompts
across 4 commands. Agents will pause more often.

Mitigation: This is an accepted trade-off. The gates protect
high-risk operations (code edits, commits, pushes, spec
modifications). The alternative — autonomous mutation under
compressed context — has worse consequences than extra prompts.

### R2: Dual-File Maintenance

Each change must be applied identically to both
`.opencode/commands/` and `internal/scaffold/assets/opencode/
commands/`. Drift detection tests catch divergence, but
editing both files doubles the implementation effort.

Mitigation: Use a task structure that processes each command
file pair together. Drift detection tests provide a safety net.

### R3: Gate Fatigue

Users who frequently run these commands may develop "click
through" behavior if too many gates appear.

Mitigation: Decision D3 (consolidated Phase 4 gate) addresses
this for the highest-frequency case. The remaining gates are
at genuinely distinct mutation boundaries.
