## Why

The `speckit-workflow/SKILL.md` dirty-tree check (lines 38-44)
uses prose-only instructions: "STOP and ask the user for
confirmation before switching branches." Under context
compression or token pressure, agents can skip the check and
create a branch despite uncommitted changes — causing work to
appear on the wrong branch or be lost entirely.

This is the same T1+T3 vulnerability pattern identified in
audit issue #346. Sibling files (`speckit.specify.md`,
`openspec-propose/SKILL.md`, `opsx-propose.md`) have already
been hardened with explicit `AskUserQuestion` tool calls via
PRs #396 and #406. The `speckit-workflow/SKILL.md` is the
remaining file that still uses the prose-only pattern.

Fixes: https://github.com/unbound-force/unbound-force/issues/395

## What Changes

Replace the prose-only dirty-tree check in
`.opencode/skills/speckit-workflow/SKILL.md` (Pre-conditions
section, lines 38-44) with an explicit `AskUserQuestion` tool
call pattern that matches the hardened sibling files.

The same change is applied to the scaffold copy at
`internal/scaffold/assets/opencode/skills/speckit-workflow/SKILL.md`
to keep both files in sync.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `speckit-workflow dirty-tree guard`: Replaces prose-only
  "STOP and ask" instruction with explicit `AskUserQuestion`
  tool call, stash/abort options, stash failure handling, and
  post-workflow stash restore reminder.

### Removed Capabilities
- None

## Impact

- **Files modified**: 2 (source skill + scaffold copy)
  - `.opencode/skills/speckit-workflow/SKILL.md`
  - `internal/scaffold/assets/opencode/skills/speckit-workflow/SKILL.md`
- **Behavioral change**: Agents using the speckit-workflow
  skill will now be forced through a structured decision gate
  before branch creation with a dirty working tree, instead of
  relying on prose that may be skipped under context pressure.
- **Risk**: Low — the pattern is proven in three sibling files.
  No Go code changes. No CI changes. No schema changes.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent skill instructions, not inter-hero
artifact communication. No artifact formats or hero interfaces
are affected.

### II. Composability First

**Assessment**: N/A

This change hardens an existing guardrail within a single skill
file. No hero dependencies are introduced or modified.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable output or provenance metadata is affected.
The change is purely to agent instruction text.

### IV. Testability

**Assessment**: PASS

The scaffold copy at `internal/scaffold/assets/` has an existing
drift-detection test that verifies it matches the source file.
Both copies are updated in sync, so existing tests continue to
pass.

### V. Security by Default

**Assessment**: PASS

This change directly improves security posture by hardening a
guardrail against context-compression bypass. The explicit
`AskUserQuestion` gate ensures agents cannot silently skip the
dirty-tree check — a form of input validation for workflow
state.
