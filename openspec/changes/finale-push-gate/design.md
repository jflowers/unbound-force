# Finale Push Gate — Design

## Context

Step 4 of `/finale` (lines 157-166) executes `git push`
without a human confirmation gate. The
`askuser-tool-confirmations` change standardized
AskUserQuestion gates across `/review-pr`,
`/address-feedback`, and `/triage-issue`, but did not
cover `/finale`. This leaves a T1 weakness: an
irreversible external action without mandatory
confirmation.

The `/address-feedback` command (section 4.4) already
implements the reference pattern: AskUserQuestion with
structured action-context options before `git push`.

Per the proposal's constitution alignment, this change
directly supports Principle V (Security by Default) by
adding a structural security control before an
irreversible external action.

## Goals / Non-Goals

### Goals
- Add AskUserQuestion gate before `git push` in
  `/finale` Step 4
- Follow the established pattern from
  `/address-feedback` section 4.4
- Update both the command file and its scaffold asset
  copy to remain byte-identical
- Option labels include action context (what will
  happen), not bare yes/no

### Non-Goals
- Refactoring other parts of `/finale`
- Adding confirmation gates to other `/finale` steps
  (PR creation in Step 5 already has interactive
  elements)
- Changing the push behavior itself (upstream
  detection, error handling)

## Decisions

### D1: Gate placement before push, after divergence check

Place the AskUserQuestion gate after the upstream/
divergence check but before the actual `git push`
command. This ensures the user sees the branch state
before confirming.

**Rationale**: The user needs to know what they are
pushing. Showing the divergence check result before
asking for confirmation gives the user context to
make an informed decision. This matches the
`/address-feedback` pattern where `git fetch` and
`git status` run before the confirmation gate.

### D2: Structured options with action-context labels

Use AskUserQuestion with options:
`["Push to remote", "Abort -- keep commits local"]`

**Rationale**: Follows D2 from the
`askuser-tool-confirmations` design -- option labels
describe consequences, not bare yes/no. "Abort -- keep
commits local" tells the user their commits are
preserved, reducing anxiety about data loss.

### D3: Unconditional gate (always ask)

The gate fires on every push, not only on divergence.
Unlike `/address-feedback` which only gates on
divergence, `/finale` gates unconditionally because it
is the final publishing step in the workflow.

**Rationale**: `/finale` is the terminal workflow
command. Every push from `/finale` deserves explicit
confirmation because it represents the transition from
"local work" to "public submission." The cost of one
extra confirmation is negligible compared to the risk
of an accidental push.

### D4: Dual-file update (command + scaffold asset)

Both files must be updated:
1. `.opencode/commands/finale.md`
2. `internal/scaffold/assets/opencode/commands/finale.md`

**Rationale**: The scaffold drift detection test
verifies that embedded assets match their canonical
sources. Updating only one file would cause test
failures.

## Risks / Trade-offs

### R1: Extra confirmation step adds friction

**Risk**: Users who run `/finale` expect a streamlined
flow. Adding a confirmation gate adds one interaction.

**Mitigation**: The gate is a single selection, not
free-text. The `/address-feedback` change proved this
pattern is lightweight. The security benefit of
preventing accidental pushes outweighs the minor
friction.

### R2: Context compression may lose the gate

**Risk**: Per issue #346, compression can summarize
away mandatory gates.

**Mitigation**: The gate is placed in a short,
structurally distinct section (Step 4) that is unlikely
to be compressed away. The Step 4 section is already
concise (10 lines). If future work adds
session-resume guards (as in the `review-pr` change),
`/finale` would benefit from the same pattern. This
is out of scope for this change but noted as a future
consideration.
