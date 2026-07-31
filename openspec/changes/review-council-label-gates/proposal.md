## Why

The `/triage-issue` command applies GitHub labels automatically
without user confirmation for all categories except `duplicate`.
This is an irreversible external action (GitHub label mutation)
that violates org policy established by issue #346: ALL label
mutations require AskUserQuestion confirmation.

The inconsistency is a T1 weakness -- the `duplicate` label
gate at lines 273-276 of `triage-issue.md` demonstrates the
correct pattern, but it is not applied to the remaining six
label categories (`bug`, `enhancement`, `question`,
`design-discussion`, `needs-info`).

Fixes: #352
Related: #346 (parent audit)

## What Changes

Generalize the existing `duplicate` label AskUserQuestion
gate in `.opencode/commands/triage-issue.md` to cover ALL
label mutations:

1. Before `gh label create`: require AskUserQuestion
   confirmation with options
   `["Yes -- create label", "No -- skip"]`.
2. Before `gh issue edit --add-label`: require
   AskUserQuestion confirmation with options
   `["Yes -- apply label", "No -- skip"]`.
3. Preserve the existing `duplicate`-specific gate (lines
   273-276) as an additional layer with its own messaging
   about close semantics.

## Capabilities

### New Capabilities
- `label-mutation-gate`: All label create and label apply
  operations in `/triage-issue` require explicit user
  confirmation via AskUserQuestion before execution.

### Modified Capabilities
- `triage-issue/label-application`: Section 4.2 changes from
  auto-apply (with duplicate exception) to confirm-all with
  a single AskUserQuestion presenting the proposed label.

### Removed Capabilities
- None

## Impact

- **File**: `.opencode/commands/triage-issue.md` (Section 4.2,
  lines ~241-276)
- **Behavior**: Users will now be asked to confirm every label
  operation, not just `duplicate`. This adds one confirmation
  step per label applied but prevents accidental/unwanted
  label mutations.
- **No code changes**: This is a command instruction change
  only (markdown), no Go source modifications.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent command instructions (markdown).
It does not affect artifact-based communication between heroes
or self-describing outputs.

### II. Composability First

**Assessment**: N/A

This change is internal to the `/triage-issue` command. It
does not introduce dependencies between heroes or affect
standalone functionality.

### III. Observable Quality

**Assessment**: PASS

The AskUserQuestion gate produces observable audit trail --
every label mutation is explicitly confirmed by the user,
improving provenance of GitHub state changes.

### IV. Testability

**Assessment**: N/A

This change modifies agent behavioral instructions (markdown
only). No Go source code is added or modified. Coverage
strategy per Constitution Principle IV is not applicable.
Behavioral verification is defined in tasks.md task 5.1.

### V. Security by Default

**Assessment**: N/A

No new dependencies, no new external inputs, no supply chain
changes. The AskUserQuestion gate strengthens the least-
privilege posture by requiring explicit user authorization
before irreversible external mutations (label create/apply).
