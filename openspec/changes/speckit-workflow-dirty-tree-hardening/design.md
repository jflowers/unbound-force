## Context

The `speckit-workflow/SKILL.md` Pre-conditions section (lines
38-44) instructs agents to check for uncommitted changes before
branch creation, but uses only prose: "STOP and ask the user
for confirmation." Under context compression, agents may skip
this check entirely, creating branches with dirty working trees.

Three sibling files have already been hardened with explicit
`AskUserQuestion` tool calls:
- `speckit.specify.md` (PR #396)
- `openspec-propose/SKILL.md` (PR #406)
- `opsx-propose.md` (PR #406)

The hardened pattern is well-established and proven.

## Goals / Non-Goals

### Goals
- Replace prose-only dirty-tree check with explicit
  `AskUserQuestion` tool call including stash/abort options
- Match the exact pattern used in sibling files for
  consistency
- Keep source file and scaffold copy in sync

### Non-Goals
- Refactoring other sections of `speckit-workflow/SKILL.md`
- Adding new guardrails beyond the dirty-tree check
- Modifying any Go source code or tests

## Decisions

### D1: Reuse the sibling hardening pattern exactly

**Decision**: Apply the same `AskUserQuestion` pattern used in
`speckit.specify.md` (PR #396) — two options ("Stash changes
and continue", "Abort -- keep changes as-is"), stash failure
handling, and post-stash verification.

**Rationale**: Consistency across all branch-creation guardrails
reduces cognitive load for both agents and human reviewers.
The pattern is proven across three files without issues.

### D2: Replace in-place rather than append

**Decision**: Replace lines 38-44 (the prose block) with the
hardened block, rather than appending a new section.

**Rationale**: The existing prose covers the same logical
requirement. Replacing it avoids duplication and conflicting
instructions within the same section.

### D3: Update scaffold copy simultaneously

**Decision**: Apply identical changes to both
`.opencode/skills/speckit-workflow/SKILL.md` and
`internal/scaffold/assets/opencode/skills/speckit-workflow/SKILL.md`.

**Rationale**: The scaffold drift-detection tests verify these
files match. Updating only one would break the build. Both
files must contain identical content.

## Risks / Trade-offs

### Low risk: Line number drift

The issue body documents updated line numbers (39-40) from PRs
#392 and #398. The implementation task must re-read the file to
locate the exact prose block rather than relying on hardcoded
line numbers.

**Mitigation**: Tasks specify matching by content pattern
("STOP and ask the user for confirmation") rather than line
numbers.

### Minimal risk: Context window increase

The hardened block is longer than the prose it replaces (~25
lines vs ~7 lines). This marginally increases the skill's
token footprint.

**Accepted trade-off**: The security improvement (preventing
silent branch creation with dirty trees) justifies the
additional tokens. The increase is small relative to the full
skill file.
