## Why

The "Branch Safety" section of `speckit-workflow/SKILL.md` (lines 114-129)
contains CRITICAL rules about never switching branches with a dirty working
tree. These rules are placed at the END of the file, after the full workflow
steps (lines 18-113). An agent executing the workflow sequentially can reach
branch-related actions (Phase Checkpoints, worker spawning) before ever
encountering these constraints.

This is a T2 weakness (CRITICAL/MANDATORY rule placed after the workflow it
governs), identified as part of the parent audit in issue #346. The same
pattern was found in `cobalt-crush.md` (issue #355) and
`openspec-apply-change/SKILL.md` (issue #359).

Fixes: #361

## What Changes

Move the branch safety content from its current position (after
"Phase Checkpoints") to a new "Pre-conditions" section placed before
"Reading tasks.md", ensuring agents encounter the CRITICAL constraint
before any workflow step that could trigger a branch switch.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `speckit-workflow skill`: Branch safety rules relocated to pre-conditions
  section, ensuring agents process them before any workflow step

### Removed Capabilities
- None

## Impact

- **File affected**: `.opencode/skills/speckit-workflow/SKILL.md`
- **Behavioral change**: Agents using this skill will encounter branch safety
  rules earlier in the file, reducing risk of dirty-tree branch switches
- **No functional change**: The rules themselves are unchanged; only their
  position in the document changes
- **Pattern alignment**: Consistent with fixes applied to sibling issues
  #355 (cobalt-crush) and #359 (openspec-apply-change)

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change restructures an agent skill file. It does not affect
artifact-based communication or inter-hero interfaces.

### II. Composability First

**Assessment**: N/A

This change modifies internal skill documentation ordering. It does
not affect standalone functionality or hero dependencies.

### III. Observable Quality

**Assessment**: N/A

This change does not affect machine-parseable output or provenance
metadata. The skill file is agent instruction content, not output.

### IV. Testability

**Assessment**: N/A

This change restructures documentation. The branch safety rules
themselves are unchanged. Drift detection tests (if any) that verify
embedded assets will continue to pass since the content is preserved.

### V. Security by Default

**Assessment**: PASS

Moving CRITICAL safety rules to a pre-conditions section reduces the
risk of agents bypassing branch safety checks due to document ordering.
This strengthens the security posture of the workflow by ensuring
constraints are processed before actions.
