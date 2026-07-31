## Why

The `speckit.implement` command contains two gates that exist
as prose instructions only, without AskUserQuestion tool call
enforcement. Under context compression or session resumption,
agents can skip these gates entirely — the same class of
vulnerability that caused issue #346 (review-pr skipping its
Step 11 confirmation gate).

**Gap A — Checklist incomplete gate** (lines 38-47): The
command instructs the agent to "STOP and ask" when checklists
are incomplete, but uses inline question text rather than an
AskUserQuestion tool call. An agent under context compression
can treat this as advisory and proceed to implementation.

**Gap B — Commit/push gate** (lines 136-151): The CRITICAL
instruction that all changes must be committed and pushed
before suggesting next steps is prose only. There is no
AskUserQuestion that blocks the agent from suggesting
branch-switch or merge steps before committing.

Both gaps are weakness types T1 (gate exists as text
instruction but is not enforced by tool call) and T4 (no
session-resume guard).

Fixes: #357 | Parent audit: #346

## What Changes

Replace two prose-only gates in `.opencode/commands/speckit.implement.md`
with AskUserQuestion tool calls that force the agent to stop
and wait for user input before proceeding.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `speckit.implement` checklist gate: Enforced via
  AskUserQuestion tool call with explicit options instead of
  inline question text
- `speckit.implement` commit/push gate: Enforced via
  AskUserQuestion tool call that blocks next-step suggestions
  until the user confirms changes are committed and pushed

### Removed Capabilities
- None

## Impact

- **File**: `.opencode/commands/speckit.implement.md`
- **Behavioral**: Agents executing `/speckit.implement` will
  now be mechanically stopped at both gates, even under
  context compression or session resumption
- **User experience**: Users will see explicit option prompts
  at both gates instead of free-form questions that an agent
  might skip
- **Risk**: Low — changes are additive hardening of existing
  gates, not new functionality

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies an agent command file (a process
artifact), not inter-hero communication or artifact
formats. No impact on artifact-based collaboration.

### II. Composability First

**Assessment**: N/A

This change is internal to the speckit.implement command.
It does not introduce dependencies between heroes or affect
standalone functionality.

### III. Observable Quality

**Assessment**: PASS

AskUserQuestion tool calls produce observable, auditable
interaction points. The gates become machine-detectable
(tool call presence) rather than prose-dependent, improving
the quality of the gate enforcement mechanism itself.

### IV. Testability

**Assessment**: N/A

This change modifies a Markdown command file, not executable
code. The gates can be verified by reviewing the command
file for AskUserQuestion tool calls at the expected
locations.

### V. Security by Default

**Assessment**: PASS

Hardening gates against context compression bypass is a
security improvement. It prevents agents from skipping
human confirmation steps — a least-privilege enforcement
pattern that ensures the human remains in control of
irreversible actions (proceeding with incomplete checklists,
switching branches with uncommitted work).
