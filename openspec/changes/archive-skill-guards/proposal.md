## Why

The `openspec-archive-change` skill (`SKILL.md`) has two
structural safety gaps identified in the parent audit
(issue #346) and filed as issue #360:

**Gap A (T3+T4)**: The commit guard at step 5 (lines 85-89)
is prose-only. The "CRITICAL: Do NOT move to step 6..."
warning has no enforcing `AskUserQuestion` gate. An agent
can read the warning, acknowledge it internally, and proceed
to archive or branch-switch with uncommitted changes — the
exact scenario the prose warns against. There is also no
session-resume guard to re-verify clean state if context
was compressed.

**Gap B (T1)**: Step 7 (line 119) executes `git checkout main`
with no `AskUserQuestion` gate. Branch switches are
irreversible actions that change working directory state and
should require explicit user confirmation, consistent with
the pattern established in other skills.

Both gaps share the same root cause pattern found across
multiple skills: irreversible actions protected by prose
warnings instead of interactive confirmation gates.

## What Changes

### Modified Capabilities
- `openspec-archive-change skill`: Add `AskUserQuestion`
  confirmation gate before archive step (step 6) to enforce
  the existing commit-guard prose
- `openspec-archive-change skill`: Add `AskUserQuestion`
  confirmation gate before `git checkout main` (step 7) to
  guard the branch switch

### New Capabilities
- None

### Removed Capabilities
- None

## Impact

- **File**: `.opencode/skills/openspec-archive-change/SKILL.md`
- **Scope**: Skill instructions only — no Go source, tests,
  or CI changes
- **Risk**: Low. Adds interactive gates to an existing
  workflow. The gates are additive and do not alter the
  archive logic itself.
- **Related**: Issue #356 applies the same Gap B fix to
  `opsx-archive.md` (the slash command counterpart). This
  change targets the skill file specifically.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent skill instructions, not
inter-hero artifact formats or communication protocols.
No artifact-based collaboration patterns are affected.

### II. Composability First

**Assessment**: N/A

This change is internal to the meta repository's skill
definitions. No hero's standalone functionality or
extension points are affected.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable output formats or provenance metadata
are affected. The change modifies interactive confirmation
flow within a skill.

### IV. Testability

**Assessment**: N/A

Skill files are declarative agent instructions, not
executable code. No testable components are introduced
or modified.

### V. Security by Default

**Assessment**: PASS

The change directly improves security posture by converting
prose-only safety warnings into enforcing interactive gates.
This prevents agents from bypassing commit verification and
branch-switch confirmation — reducing the risk of data loss
from uncommitted changes following to the wrong branch.
