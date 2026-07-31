## Context

The `speckit.clarify` command contains a sequential questioning loop
(step 4, lines 100-134) that instructs agents to present "EXACTLY ONE
question at a time" and wait for user responses. This instruction is
prose-only — no `AskUserQuestion` tool call is specified. Under
context compression, the prose constraint is not reliably enforced,
allowing agents to batch questions or assume answers.

This is the same T3 weakness pattern identified in the parent audit
(issue #346) where the review-pr confirmation gate was bypassed when
session context was compressed. Other commands in the codebase
(review-pr, review-council, address-feedback, triage-issue) already
use explicit `AskUserQuestion` tool call language to enforce
interaction gates.

## Goals / Non-Goals

### Goals
- Enforce one-at-a-time questioning via mandatory AskUserQuestion
  tool calls
- Prevent question batching under context compression
- Prevent agents from advancing to the next question without
  receiving a tool response
- Follow the established pattern used by other commands
  (review-pr, review-council, address-feedback)

### Non-Goals
- Changing the questioning taxonomy or prioritization logic
- Modifying the spec integration behavior (step 5)
- Adding session-resume guards (the clarify command does not have
  the same irreversible side-effect risk as review-pr's GitHub
  review posting)
- Modifying the recommendation/suggestion presentation format

## Decisions

### D1: Use AskUserQuestion for both question formats

The clarify command has two question formats: multiple-choice
(2-5 options) and short-answer (<=5 words). Both MUST use the
AskUserQuestion tool call. For multiple-choice, the options map
directly to AskUserQuestion's options parameter. For short-answer,
the tool call uses open-ended mode (no preset options).

**Rationale**: Consistency. Both formats require user interaction
and both are vulnerable to the same context compression bypass.

### D2: Add gate language at the structural level, not inline

The AskUserQuestion requirement is added as a structural
constraint at the beginning of step 4, not scattered inline
within the formatting instructions. A prominent gate marker
(similar to review-pr's approach) makes the constraint harder
to skip during fast-path reasoning.

**Rationale**: The issue root cause is that inline prose
constraints get lost during context compression. A prominent,
structurally distinct gate is more resilient.

### D3: Preserve existing formatting instructions

The multiple-choice table format, recommendation presentation,
and short-answer format instructions remain unchanged. Only the
delivery mechanism is constrained — the content of each question
stays the same.

**Rationale**: The formatting instructions are well-designed and
serve clarity. The fix is about enforcement, not content.

### D4: No scaffold copies needed

Unlike `speckit.testreview.md`, the `speckit.clarify.md` file
exists only in `.opencode/commands/`. There are no copies in
`cmd/unbound-force/.opencode/command/` or
`internal/scaffold/.opencode/command/` that need synchronized
updates.

**Rationale**: Verified by filesystem search. Only one file
requires modification.

## Risks / Trade-offs

### Low risk: Over-constraining agent flexibility

Adding mandatory tool calls slightly reduces an agent's ability
to optimize question presentation. However, the one-at-a-time
requirement was already the intended behavior — this change
merely enforces it structurally.

### Mitigated: Pattern drift across commands

Multiple commands now use AskUserQuestion gates. If the tool API
changes, all commands need updating. This is an acceptable
coupling — all commands already depend on the same tool, and the
usage pattern is consistent.
