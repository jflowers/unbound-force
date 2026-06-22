## Context

Three slash commands (`/review-pr`, `/address-feedback`,
`/triage-issue`) use free-text typed confirmations for
human interaction points. The `opsx-*` commands already
use the **AskUserQuestion tool** with structured options.
This change aligns the three commands to the established
convention.

## Goals / Non-Goals

### Goals
- Convert all 15 free-text confirmation points across
  three commands to use the AskUserQuestion tool
- Preserve all existing safety semantics (no posting
  without confirmation, deliberate APPROVE selection)
- Maintain consistency with the AskUserQuestion patterns
  established in `opsx-propose`, `opsx-apply`, and
  `opsx-archive`
- Keep scaffold assets byte-identical to command files

### Non-Goals
- Adding new interaction points or changing workflow
  logic
- Modifying the AskUserQuestion tool itself
- Changing artifact schemas, JSON payloads, or API
  calls
- Modifying any Go source code beyond scaffold assets

## Decisions

### D1: Structured selection for all confirmations

All 15 interaction points use the AskUserQuestion tool
with predefined option lists, including the APPROVE
verdict confirmation in `/review-pr`. The structured
selection mechanism provides sufficient deliberateness
-- selecting "Approve -- post review" from a list
requires more intentional action than typing a word.

**Rationale**: Consistency across all commands. The
previous design required typing `"approve"` explicitly
(not `"yes"`) to prevent reflexive confirmation. A
structured selection achieves the same goal: the user
must deliberately choose the correct option from a
visible list.

### D2: Option labels include action context

Each option label describes what will happen, not just
a bare `yes/no`. For example:
- "Yes -- post as GitHub review" (not just "Yes")
- "Approve -- post review" (not just "Approve")
- "No -- skip posting" (not just "No")

**Rationale**: Action-descriptive labels reduce
ambiguity and help users understand the consequence
of their selection without re-reading the prompt.

### D3: Multi-step interactions use sequential prompts

For interaction points where a choice requires
follow-up input (e.g., `/address-feedback` MODIFY
requires an alternative approach), the first prompt
uses structured options and the follow-up uses an
open-ended AskUserQuestion for free-form input.

**Rationale**: Matches the pattern in `opsx-propose`
where open-ended follow-ups are used after initial
structured selection.

### D4: Scaffold assets updated in lockstep

Each command file under `.opencode/commands/` has a
byte-identical copy under
`internal/scaffold/assets/opencode/commands/`. Both
must be updated together. The existing drift detection
test (`TestEmbeddedAssets_MatchSource`) enforces this.

**Rationale**: Required by the scaffold pattern.
Existing test infrastructure validates this
automatically.

### D5: Bold formatting convention preserved

The AskUserQuestion tool is referenced as
`**AskUserQuestion tool**` (bold, PascalCase) in all
command text, matching the existing convention in
`opsx-propose.md`, `opsx-apply.md`, and
`opsx-archive.md`.

## Risks / Trade-offs

### R1: Option list length

Some interaction points (e.g., `/review-pr` APPROVE
confirmation) have 4 options. Long option lists may
feel heavier than a simple `yes/no` prompt. Accepted
trade-off: the additional options (edit, change-verdict)
were already present in the free-text version and
provide genuine value.

### R2: Per-item triage in `/address-feedback`

The per-item triage (Phase 3.2) presents 4 options
for each feedback item (ACCEPT/MODIFY/REJECT/ASK).
For PRs with many feedback items, repeated structured
prompts may feel slower than typing keywords. Accepted
trade-off: clarity and discoverability outweigh the
minor friction increase.

### R3: No behavioral regression

The change is purely instructional (markdown edits).
No Go code logic changes, no API changes, no schema
changes. Risk of behavioral regression is minimal.
The scaffold drift test provides automated
verification.
<!-- scaffolded by uf vdev -->
