## Why

The STOP HERE gate in 5 speckit command files is positioned
after the workflow steps it governs. This means the agent
reads and executes all workflow steps before encountering the
instruction to stop. The gate must appear before the steps
to prevent phase boundary violations (speckit commands produce
artifacts, not implementation).

Issue #363 fixed `speckit.tasks.md` and `speckit.plan.md` by
moving the STOP HERE block to a bolded preamble immediately
after the `## Outline` heading. This change applies the same
fix to the remaining 5 commands.

Fixes: https://github.com/unbound-force/unbound-force/issues/386

## What Changes

Move the STOP HERE block from the end of each file to a
preamble position immediately after the first major heading
(e.g., `## Outline`, `## Goal`, or equivalent) in these 5
speckit command files:

- `.opencode/commands/speckit.specify.md`
- `.opencode/commands/speckit.clarify.md`
- `.opencode/commands/speckit.analyze.md`
- `.opencode/commands/speckit.checklist.md`
- `.opencode/commands/speckit.testreview.md`

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `speckit.specify`: STOP gate moved to preamble position
- `speckit.clarify`: STOP gate moved to preamble position
- `speckit.analyze`: STOP gate moved to preamble position
- `speckit.checklist`: STOP gate moved to preamble position
- `speckit.testreview`: STOP gate moved to preamble position

### Removed Capabilities
- None

## Impact

- **5 command files**: Content reordering only (no new text,
  no logic changes). The STOP HERE block moves from after
  the last workflow step to immediately after the first
  major section heading.
- **Agent behavior**: Agents will encounter the STOP
  constraint before reading workflow steps, reducing the
  risk of phase boundary violations.
- **No code changes**: This is a documentation/command-file-only
  change. No Go source, tests, or CI workflows are affected.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent command files (workflow
instructions) and does not affect artifact-based
communication or inter-hero interfaces.

### II. Composability First

**Assessment**: N/A

No new dependencies are introduced. The change is
internal to this meta repository's command files.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable outputs or provenance metadata
are affected. The command files are agent instructions,
not data artifacts.

### IV. Testability

**Assessment**: N/A

The change involves moving a text block within Markdown
files. No testable components are introduced or modified.
Verification is by manual inspection of file structure.
