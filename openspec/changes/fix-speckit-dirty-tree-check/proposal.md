## Why

The dirty-tree check in `speckit.specify.md` (lines 42-50) describes
a safety gate before `git checkout -b` entirely in prose. It says
"STOP and ask the user for confirmation" but never specifies an
`AskUserQuestion` tool call. Under context compression, an agent can
skip the check entirely and create the branch despite uncommitted
changes, risking work applied to the wrong branch or lost.

This is a T1+T3 weakness (gate exists in prose but is not enforced by
a tool call), identified in the parent audit (issue #346). Sibling
issues #350 and #353 address the same pattern in `openspec-propose`
and `opsx-propose` respectively.

Fixes #358.

## What Changes

Replace the prose-only dirty-tree guard in `speckit.specify.md` with
an explicit `AskUserQuestion` tool call that presents the user with
structured options before proceeding past uncommitted changes.

## Capabilities

### New Capabilities
- None (this is a hardening fix, not a new feature)

### Modified Capabilities
- `speckit.specify`: Dirty-tree check before branch creation now uses
  an explicit `AskUserQuestion` tool call with structured options
  instead of prose-only instructions

### Removed Capabilities
- None

## Impact

- **File**: `.opencode/commands/speckit.specify.md` (lines 40-50)
- **Behavior**: Agents executing the speckit specify command will now
  encounter a structured tool call when uncommitted changes are
  detected, making it resistant to context compression skipping
- **Risk**: Low -- this is a documentation/instruction change only,
  no Go source code is modified
- **Related sibling changes**: Issues #350 (openspec-propose SKILL.md)
  and #353 (opsx-propose.md) address the same pattern in other files

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent instructions in a command file. It does not
affect artifact-based communication or inter-hero collaboration.

### II. Composability First

**Assessment**: N/A

This change is internal to the speckit workflow command. It does not
introduce dependencies or affect standalone functionality.

### III. Observable Quality

**Assessment**: PASS

The change makes the dirty-tree guard observable: instead of relying on
prose interpretation, the structured tool call creates an auditable
decision point with explicit user confirmation.

### IV. Testability

**Assessment**: N/A

This is an agent instruction change, not a code change. No new
components require isolation testing.

### V. Security by Default

**Assessment**: PASS

This change hardens input validation by ensuring user intent is
explicitly confirmed before a branch-switching operation that could
affect uncommitted work. It enforces the principle that
security-sensitive operations require structured validation, not
prose-level trust.
