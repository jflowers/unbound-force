## Context

`uf.triage-issue.md` Phase 4 is labeled "(Interactive)" but
the only enforcement of interactivity is scattered `question
tool` references within individual sub-steps (4.2, 4.3, 4.4).
When an agent operates under compressed context or loses
instruction fidelity, these scattered references are
insufficient to prevent autonomous mutation. Three other
commands (`uf.review-council`, `uf.review-pr`, `uf.finale`)
solve this with `>>> MANDATORY GATE <<<` markers -- a proven
pattern that this command lacks.

The current Phase 4 structure:

```
Phase 4: Act (Interactive)       <-- no gate marker
  4.1 Present Analysis Summary   <-- display-only, no stop
  4.2 Label Application          <-- inline question tool ref
  4.3 Comment Posting            <-- inline question tool ref
  4.4 Child Issue Creation       <-- inline question tool ref
  4.5 Artifact                   <-- write-only, no mutation
```

Phase 4 guardrails (section at end of file) include rules like
"never post comments without user confirmation" and "never
create child issues without user confirmation," but these are
in a separate section far from the Phase 4 entry point.

## Goals / Non-Goals

### Goals
- Add a `>>> MANDATORY GATE <<<` block at Phase 4 entry that
  creates an enforceable hard stop between classification
  (Phase 3) and mutation (Phase 4)
- Include a compressed-context resume guard following the same
  pattern as `uf.review-council.md` Step 7f
- Reiterate the `gh api --input <tmpfile>` requirement at the
  mutation boundary (already a guardrail, but not at the gate)
- Require Phase 4.1 summary display as a precondition for
  proceeding through the gate
- Keep both copies of the file in sync
  (`.opencode/commands/` and `internal/scaffold/assets/`)

### Non-Goals
- Refactoring Phase 4 sub-step structure (4.2/4.3/4.4 inline
  question tool references remain as defense-in-depth)
- Adding gates to other phases (Phase 1-3 are read-only)
- Changing the triage artifact format (Phase 4.5)

## Decisions

### D1: Single gate at Phase 4 entry, not per-sub-step

**Rationale**: The individual sub-steps (4.2, 4.3, 4.4) already
have inline `question tool` references for per-action
confirmation. Adding `>>> MANDATORY GATE <<<` to each would be
redundant. The root cause from #473 was that the agent skipped
all of Phase 4's interactivity, not that it selectively skipped
one sub-step. A single gate at Phase 4 entry addresses the root
cause.

### D2: Gate positioned between Phase 4 heading and 4.1

**Rationale**: The gate block sits immediately after the Phase 4
heading and before 4.1 (summary display). The gate instructions
require the agent to display the 4.1 summary first, then present
the confirmation question. This ensures the user sees the full
triage analysis before being asked to approve mutations.

### D3: Follow exact `uf.review-council` gate pattern

**Rationale**: The `uf.review-council.md` Step 7f gate is the
most battle-tested pattern -- it includes the marker, the
session-resume guard, the question tool confirmation, and
explicit stop instructions for each user response. Reusing this
pattern verbatim (adapted to triage context) ensures consistency
and leverages proven effectiveness.

### D4: Reiterate `--input` requirement in gate block

**Rationale**: The guardrails section already specifies the
`gh api --input <tmpfile>` requirement for shell injection
prevention, but it is 250+ lines away from the mutation
boundary. Reiterating it in the gate block puts the safety
requirement at the point of maximum relevance -- when the agent
is about to execute mutations. This aligns with Principle V
(Security by Default) from the proposal's constitution
alignment.

### D5: Both files updated identically

**Rationale**: `.opencode/commands/uf.triage-issue.md` is the
deployed command file; `internal/scaffold/assets/opencode/
commands/uf.triage-issue.md` is the scaffold canonical. The
existing drift-detection test in the build verifies these match.
Both must be updated with identical content.

## Risks / Trade-offs

### R1: Gate adds friction to triage workflow

**Risk**: Users may find the additional confirmation step
slightly slower for straightforward triage runs.

**Mitigation**: The gate fires once at Phase 4 entry, not per
sub-step. For most triage runs, this adds a single confirmation.
The sub-step confirmations (4.2/4.3/4.4) remain but are not
duplicated -- they handle per-action granularity (e.g., "apply
this label?" vs "create these child issues?").

### R2: Compressed-context resume guard may re-confirm

**Risk**: If an agent session is resumed from compressed
context, the guard requires re-displaying the summary and
re-confirming. This could feel redundant to users who already
confirmed in a prior context window.

**Mitigation**: This is the intended behavior -- identical to
the `uf.review-council` pattern. False re-confirmation is
harmless; posting without consent is a violation.
