## Why

In `speckit.tasks.md` and `speckit.plan.md`, the "STOP HERE.
Do NOT proceed to implementation." gate appears AFTER the
workflow steps it governs. An agent executing the workflow
reads through artifact-creation steps, completes them, and
by the time it encounters the STOP instruction, momentum
has already carried it past the boundary.

This is a T2 weakness: a CRITICAL/MANDATORY rule placed
after the workflow it governs. The prior fix (archived
change `2026-04-28-inline-stop-instructions`) added inline
STOP blocks to all 9 spec-phase commands, but positioned
them at the end of the numbered workflow steps rather than
before them as a preamble.

Fixes #363 (parent audit: #346 root cause analysis).

## What Changes

### New Capabilities
- None

### Modified Capabilities
- `speckit.tasks.md`: Move STOP HERE block from between
  step 5 (task generation) and step 6 (report) to a
  bolded preamble immediately after the Outline heading,
  before Step 1.
- `speckit.plan.md`: Move STOP HERE block from after step
  4 (plan workflow) to a bolded preamble immediately
  after the Outline heading, before Step 1.

### Removed Capabilities
- None

## Impact

- 2 Markdown files modified (`.opencode/commands/speckit.tasks.md`,
  `.opencode/commands/speckit.plan.md`)
- No Go code changes
- No scaffold asset syncs needed (files are command
  definitions, not embedded assets)
- No test changes

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent behavioral instructions in
Markdown command files. No artifact formats, inter-hero
communication, or artifact envelopes are affected.

### II. Composability First

**Assessment**: N/A

No hero dependencies, extension points, or standalone
functionality are affected. This is an internal
instruction-ordering fix.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable output, provenance metadata, or
quality evidence is affected.

### IV. Testability

**Assessment**: N/A

No testable components are modified. The change is to
agent instruction text only.

### V. Security by Default

**Assessment**: N/A

No code, dependencies, or security-sensitive operations
are affected.
