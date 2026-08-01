## Context

`/uf.review-council` is an 799-line command template that
orchestrates a multi-phase review workflow: pre-flight checks
(Phase 1a-1c), parallel Divisor agent delegation (Step 2),
finding consolidation (Step 3), fix loop (Steps 4-5), final
report (Step 6), and optional GitHub review posting (Step 7
with sub-steps 7a-7g).

When OpenCode's context compression fires, early phases are
summarized and procedural instructions for later steps are
lost. This is the same root cause as #373 (`/uf.review-pr`),
and the same three-part remediation pattern applies.

The existing hardening on `/uf.review-pr` (PR #371) added a
session-resume guard and MANDATORY GATE markers. Issue #378
proposes the full three-part pattern for `/uf.review-council`:
session-resume guard, execution checklist, and step-level
checkpoint reminders.

## Goals / Non-Goals

### Goals
- Prevent loss of the full-branch-diff review scope rule
  after compression
- Prevent loss of the fix loop iteration counter after
  compression
- Prevent bypass of the Step 7f APPROVE confirmation gate
  after compression
- Follow the proven pattern from `/uf.review-pr` hardening
- Keep both copies in sync (`.opencode/commands/` and
  `internal/scaffold/assets/opencode/commands/`)

### Non-Goals
- Restructuring the command into parent/subagent
  architecture (that is PR #413's scope for review-pr,
  and would be a separate effort for review-council)
- Changing the review workflow logic (steps, gates,
  verdicts all remain identical)
- Adding compression resistance to other commands
  (each command gets its own change)

## Decisions

### D1: Three-part compression resistance pattern

**Decision**: Apply the same three-part pattern used in
issue #373's proposed fix:

1. **Session-resume guard** (top of file, after frontmatter)
2. **Execution checklist** (before Instructions section)
3. **Step-level checkpoint reminders** (end of each phase/step)

**Rationale**: This is the remediation pattern specified in
issue #378. The guard provides recovery instructions; the
checklist provides compression-resistant state tracking (it
is actively edited content, not passive instructions); the
checkpoints ensure the agent maintains the checklist.

**Constitution**: Aligns with Observable Quality -- the
checklist makes workflow execution state explicitly trackable.

### D2: Checklist placement and structure

**Decision**: Place the execution checklist as a blockquote
section immediately after the session-resume guard, before
the "Determine Review Mode" section. Structure it as:

```markdown
> **EXECUTION CHECKLIST** — Update each item using the
> Edit tool as you complete it. Mark `[x]` when done.
>
> - [ ] Phase 1a: Pre-flight checks
> - [ ] Phase 1b: Gaze quality analysis
> - [ ] Phase 1c: Review context discovery
> - [ ] Step 2: Divisor agent delegation (full branch diff)
> - [ ] Step 3: Finding consolidation
> - [ ] Step 4: Fix loop (iteration: _/3)
> - [ ] Step 5: Iteration limit check
> - [ ] Step 6: Final report
> - [ ] Step 7a: PR detection
> - [ ] Step 7b: Review state fetching
> - [ ] Step 7c: Pre-posting checks
> - [ ] Step 7d: Finding aggregation
> - [ ] Step 7e: Inline comment preparation
> - [ ] Step 7f: Human confirmation (MANDATORY GATE)
> - [ ] Step 7g: Post review
```

**Rationale**: Blockquote formatting makes the checklist
visually distinct. Including the fix loop iteration counter
directly in the checklist (`iteration: _/3`) makes it
compression-resistant -- the agent updates the counter
in-place. The `(MANDATORY GATE)` annotation on 7f provides
an additional salience signal.

### D3: MANDATORY GATE markers on Step 7f

**Decision**: Wrap the Step 7f confirmation section with
high-salience ASCII delimiters:

```
>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<
```

and

```
>>> END MANDATORY GATE <<<
```

**Rationale**: Same pattern as PR #371 for `/uf.review-pr`.
These distinctive ASCII tokens survive compression as
high-salience markers. They visually delimit the
confirmation gate and signal to the agent that this
section requires special attention.

### D4: Session-resume guard placement

**Decision**: Place the session-resume guard as a blockquote
immediately after the `# Command: /uf.review-council`
heading and before the `## User Input` section.

```markdown
> **Session-resume guard**: If this session was resumed
> from compressed context, re-read this entire template
> before continuing. Do NOT infer step completion from
> compressed summaries. Check the EXECUTION CHECKLIST
> below for actual completion state. If the checklist
> shows unchecked items, resume from the first unchecked
> item.
```

**Rationale**: Placing the guard at the very top maximizes
the chance it survives compression (first-content bias in
compression heuristics). Directing the agent to the
checklist provides a concrete recovery mechanism rather
than vague re-read instructions.

### D5: Checkpoint reminder format

**Decision**: Add a one-line checkpoint reminder at the end
of each phase/step in this format:

```markdown
**Checkpoint**: Mark `Phase 1a` complete in the EXECUTION
CHECKLIST above using the Edit tool before proceeding.
```

**Rationale**: Keeps reminders minimal (one line each,
~60-70 characters) to avoid bloating the template. The
explicit mention of "Edit tool" reinforces that the
checklist is a live document. The "before proceeding"
instruction creates a hard gate between steps.

### D6: Dual-file sync

**Decision**: Apply identical changes to both:
- `.opencode/commands/uf.review-council.md`
- `internal/scaffold/assets/opencode/commands/uf.review-council.md`

**Rationale**: The scaffold copy is the canonical source
distributed by `uf init`. Both files must be byte-identical
to pass drift detection tests.

## Risks / Trade-offs

### R1: Template size increase

The three-part pattern adds ~50-60 lines to an already
799-line file. This slightly increases the likelihood of
compression being triggered in the first place. However,
the added content is specifically designed to be
compression-resistant, so the net effect is positive.

### R2: Edit tool reliability

The execution checklist depends on the agent correctly
using the Edit tool to update checkboxes. If the Edit tool
fails or the agent skips updates, the checklist becomes
stale. Mitigation: the checkpoint reminders at each step
create multiple redundant prompts to update the checklist.

### R3: Not a complete solution

The three-part pattern mitigates compression effects but
does not eliminate the root cause (template-as-conversation-
content). The full solution is the parent/subagent
architecture proposed in #373/#413. This hardening is an
interim measure that provides meaningful protection at low
implementation cost.
