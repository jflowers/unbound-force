## Why

The `openspec-propose` skill (`SKILL.md`) and its companion command
(`opsx-propose.md`) both describe a dirty-tree guard before
`git checkout -b` — but the guard exists only in prose. No explicit
`AskUserQuestion` tool call is specified to enforce user confirmation.

Under context compression (long sessions, large tool outputs), the
prose-only guard reasoning can be omitted by the agent, causing it to
silently switch branches despite uncommitted changes. This is a
T1 (prose-only gate) + T3 (no session-resume guard) weakness pattern
identified in the parent audit (issue #346).

Fixes: #350, #353

## What Changes

Replace the prose-only dirty-tree guard in both files with an explicit
`AskUserQuestion` tool call that forces the agent to obtain user
confirmation before proceeding with `git checkout -b` when uncommitted
changes are detected.

## Capabilities

### New Capabilities
- None (this is a hardening fix, not a new feature)

### Modified Capabilities
- `dirty-tree-guard`: Upgraded from prose-only description to explicit
  AskUserQuestion enforcement with concrete options
  ("Stash changes and continue" / "Abort — keep changes as-is")

### Removed Capabilities
- None

## Impact

- **Files affected**:
  - `.opencode/skills/openspec-propose/SKILL.md` (lines 51-64)
  - `.opencode/commands/opsx-propose.md` (lines 44-57)
- **Behavioral change**: Agents following these instructions will now
  be required to invoke the AskUserQuestion tool (not just reason about
  asking) when uncommitted changes are detected. This makes the guard
  resilient to context compression.
- **Risk**: Low. The change is additive — it strengthens an existing
  guard without altering the happy path (clean working tree).

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent instruction artifacts (skill and command
files), not inter-hero communication or artifact exchange formats.

### II. Composability First

**Assessment**: N/A

No dependencies are introduced or modified. The skill and command
remain independently usable.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable output or provenance metadata is affected.

### IV. Testability

**Assessment**: PASS

The fix is verifiable: an agent following the updated instructions
MUST invoke the AskUserQuestion tool (an observable side effect) when
`git status --short` produces output. This is testable by reviewing
agent behavior in a dirty-tree scenario.

### V. Security by Default

**Assessment**: PASS

This change directly improves security posture by closing a gate
bypass vulnerability. The prose-only guard allowed silent branch
switches with uncommitted work — a data integrity risk. The explicit
tool-call enforcement ensures the gate cannot be optimized away.
