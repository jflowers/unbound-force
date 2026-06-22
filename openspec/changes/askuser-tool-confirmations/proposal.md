## Why

Three slash commands (`/review-pr`, `/address-feedback`,
`/triage-issue`) use free-text typed confirmations
(`yes/no`, `approve`, `ACCEPT/MODIFY/REJECT/ASK`) for
human interaction points. This is inconsistent with the
established convention used by `opsx-propose`,
`opsx-apply`, and `opsx-archive`, which use the
**AskUserQuestion tool** with structured options.

Free-text confirmations create friction:
- Users must remember exact keywords (`approve` vs `yes`)
- Typos cause unnecessary retries
- The agent must parse ambiguous natural language to
  determine intent
- No discoverability of available choices

The AskUserQuestion tool provides structured selection
that is more discoverable, less error-prone, and
consistent across all slash commands.

## What Changes

Convert all 15 human interaction points across three
slash commands from free-text typed confirmations to
structured AskUserQuestion tool prompts with predefined
options.

## Capabilities

### New Capabilities
- None (no new functionality)

### Modified Capabilities
- `/review-pr`: 6 interaction points converted from
  free-text to structured AskUserQuestion prompts
- `/address-feedback`: 5 interaction points converted
  from free-text to structured AskUserQuestion prompts
- `/triage-issue`: 4 interaction points converted from
  free-text to structured AskUserQuestion prompts

### Removed Capabilities
- None

## Impact

**Files modified** (3 command files + 3 scaffold assets):
- `.opencode/commands/review-pr.md`
- `.opencode/commands/address-feedback.md`
- `.opencode/commands/triage-issue.md`
- `internal/scaffold/assets/opencode/commands/review-pr.md`
- `internal/scaffold/assets/opencode/commands/address-feedback.md`
- `internal/scaffold/assets/opencode/commands/triage-issue.md`

**Behavioral change**: All human confirmation gates
retain their safety semantics (never post without
confirmation, never merge without approval). Only the
input mechanism changes from typed text to structured
selection.

**Scaffold drift**: Each command file has a
corresponding scaffold asset that must be kept
byte-identical. Both copies must be updated together.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent prompt instructions (slash
command markdown files), not inter-hero artifact
exchange. No artifact formats, envelopes, or hero
interfaces are affected.

### II. Composability First

**Assessment**: N/A

No hero dependencies are introduced or modified. The
commands remain independently usable. The AskUserQuestion
tool is a built-in OpenCode capability, not a hero
dependency.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable outputs or provenance metadata are
affected. The triage artifact schemas and review posting
payloads remain unchanged.

### IV. Testability

**Assessment**: PASS

The scaffold drift detection tests
(`TestEmbeddedAssets_MatchSource`) will verify that
command files and their scaffold assets remain
synchronized. No new test infrastructure is needed.
<!-- scaffolded by uf vdev -->
