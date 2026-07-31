## Context

The `/triage-issue` command in `.opencode/commands/triage-issue.md`
performs GitHub label mutations in Section 4.2 (Label Application).
Currently, labels are applied automatically without user
confirmation, with a single exception: the `duplicate` label
requires AskUserQuestion confirmation at lines 273-276.

Per org policy from issue #346: all irreversible external actions
(T1 weakness type) require AskUserQuestion gates. Label mutations
are irreversible without manual reversal.

The proposal (see `proposal.md`) establishes that all label
mutations MUST be gated. This design documents how to implement
that gate consistently.

## Goals / Non-Goals

### Goals
- Gate ALL label create operations behind AskUserQuestion
- Gate ALL label apply operations behind AskUserQuestion
- Preserve the existing `duplicate`-specific messaging about
  close semantics as a supplementary gate
- Maintain the existing re-run check (skip if label already
  applied)
- Keep the user flow efficient: present label name and
  action in the confirmation prompt

### Non-Goals
- Batch multiple labels into a single confirmation (each label
  gets its own gate, matching the existing single-label-per-
  triage pattern)
- Changes to `/review-council` (that command does not perform
  label mutations)
- Changes to label removal operations (out of scope for #352)
- Refactoring the triage command beyond Section 4.2

## Decisions

### D1: Single confirmation flow per label operation

Rather than separating "create" and "apply" into two sequential
confirmations, combine them into a single flow:

1. If the label does not exist: ask
   `["Yes -- create and apply label '<label>'", "No -- skip"]`
2. If the label exists: ask
   `["Yes -- apply label '<label>'", "No -- skip"]`

**Rationale**: Two confirmations for the same label (create
then apply) adds friction without safety benefit. The user
understands they are approving the label being present on
the issue.

### D2: Preserve duplicate-specific gate as supplementary

The existing `duplicate` gate (lines 273-276) carries
additional messaging about close semantics. This is preserved
as an additional layer after the general label confirmation.
The flow for `duplicate` becomes:

1. General gate: "Yes -- apply label 'duplicate'" / "No -- skip"
2. If confirmed: supplementary gate about close semantics
   (existing behavior at lines 273-276)

**Rationale**: The `duplicate` label has unique side effects
(signals closure). The supplementary gate provides context
that the general gate does not.

### D3: Skip-on-decline semantics

When the user selects "No -- skip":
- Record the skip in `actions_taken` (existing pattern)
- Continue to Section 4.3 (Comment Composition)
- Do NOT treat a label skip as a triage abort

**Rationale**: The user may want to post a triage comment
without applying a label. The label and comment are
independent actions.

### D4: Observable Quality alignment

Per constitution Principle III, the AskUserQuestion gate
produces an observable audit trail: every label mutation
is explicitly confirmed by the user. The `actions_taken`
JSON artifact already records which labels were applied;
adding confirmation tracking strengthens provenance.

## Coverage Strategy

This change modifies agent command instructions (markdown
only). No Go source code is added or modified. Coverage
strategy per Constitution Principle IV is not applicable.
Behavioral verification is defined in tasks.md task 5.1.

## Risks / Trade-offs

### Added friction

Every triage now requires at least one additional
confirmation step for the label. This is an accepted
trade-off: the org policy from #346 prioritizes preventing
accidental mutations over speed.

### Duplicate label gets two confirmations

The `duplicate` category will see two AskUserQuestion
prompts (general + close-semantics). This is intentional --
the supplementary gate carries unique information. If user
feedback indicates this is excessive, the supplementary
gate could be merged into the general gate's messaging in
a future change.

### No batching

If future triage supports multi-label application, each
label will require its own gate. This is consistent with
the current single-label-per-triage pattern and can be
revisited if the pattern changes.
