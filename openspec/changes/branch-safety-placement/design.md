## Context

The `speckit-workflow/SKILL.md` file contains a "Branch Safety" section
(lines 114-129) with CRITICAL rules about dirty working tree handling.
These rules appear after the full workflow (lines 18-113), meaning an
agent can execute branch-affecting actions before encountering the
safety constraints.

This is classified as a T2 weakness: a CRITICAL/MANDATORY rule placed
after the workflow it governs. The fix follows the same pattern as
sibling issues #355 and #359.

## Goals / Non-Goals

### Goals
- Move branch safety rules before any workflow step that could trigger
  a branch switch
- Create a "Pre-conditions" section as the first actionable section
  after the introductory text
- Preserve all existing branch safety rule content verbatim
- Maintain consistency with the fix pattern used in sibling issues

### Non-Goals
- Rewriting or expanding the branch safety rules themselves
- Modifying other sections of the skill file
- Addressing other potential T2 weaknesses in this file
- Changing the behavior or semantics of any rules

## Decisions

**D1: Place pre-conditions before "Reading tasks.md" (line 30)**

The "When This Skill Applies" section (lines 18-28) is a detection
check, not a workflow step. The first actionable workflow section is
"Reading tasks.md" (line 30). The pre-conditions section MUST appear
between "When This Skill Applies" and "Reading tasks.md" so agents
encounter it before any workflow action.

**D2: Use "Pre-conditions" as the section heading**

Consistent with the issue description and the pattern established
in sibling fixes. The heading clearly signals that these are
constraints to check before proceeding.

**D3: Remove the original "Branch Safety" section entirely**

The content moves wholesale to "Pre-conditions". Leaving a stub or
cross-reference at the old location would create maintenance burden
and a risk of drift. Delete the old section completely.

**D4: Preserve content verbatim**

The branch safety rules are well-written and correct. Only the
position changes. The content within the new "Pre-conditions"
section MUST match the original "Branch Safety" content with no
semantic modifications, though minor formatting adjustments (e.g.,
adjusting the heading level, adding a CRITICAL label) are acceptable.

## Risks / Trade-offs

**R1: Agents with cached/stale skill versions**

Agents that have already loaded the old version of the skill in an
active session will not benefit from this change until their next
session. This is inherent to all skill file changes and not specific
to this fix. Risk: LOW.

**R2: Merge conflicts with sibling fixes**

If issues #355 or #359 are being worked on concurrently and share
any common file, there could be merge conflicts. Since each issue
targets a different file, this risk is NONE.
