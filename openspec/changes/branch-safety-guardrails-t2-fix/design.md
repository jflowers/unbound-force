## Context

Three agent instruction files place CRITICAL branch safety
rules at the end of the file, after all workflow instructions
they govern. This is a Type T2 weakness: an agent processing
instructions sequentially may execute branch operations before
encountering the constraints that should prevent unsafe behavior.

The root cause was identified during issue #346 analysis.
The three affected files are:
- `.opencode/agents/cobalt-crush-dev.md` — has no branch safety
  section at all
- `.opencode/skills/openspec-apply-change/SKILL.md` — branch
  safety rule at line 212 of 219 (Guardrails section)
- `.opencode/skills/speckit-workflow/SKILL.md` — Branch Safety
  section at line 114 of 148

## Goals / Non-Goals

### Goals
- Move branch safety constraints to appear BEFORE the workflow
  instructions they govern in all three files
- Follow each issue's prescribed fix structure (Pre-conditions
  block pattern)
- Maintain the existing constraint text — no weakening or
  strengthening of the rules themselves

### Non-Goals
- Auditing other agent/skill files for T2 weaknesses (separate
  effort)
- Changing the substance of branch safety rules
- Modifying Go source code, CI workflows, or schemas
- Adding automated enforcement (e.g., git hooks) — this is a
  prompt engineering fix only

## Decisions

### D1: Pre-conditions pattern for all three files

Each file will get a "Pre-conditions" block placed immediately
before the first workflow step or instruction section. This is
consistent with the fix structure proposed in all three issues.

**Rationale**: The pre-conditions pattern is a well-established
technique in agent prompt engineering — placing constraints
before actions ensures they are processed in the correct order.

### D2: File-specific placement

- **cobalt-crush-dev.md**: Add a "Pre-conditions" subsection
  before "Code Implementation Checklist" (line 50). This is
  the first section where the agent begins taking action. The
  "Engineering Philosophy" and "Source Documents" sections above
  are declarative context, not actionable workflow steps.

- **openspec-apply-change/SKILL.md**: Add a "Pre-condition"
  block after "Steps" (line 16) and before Step 1 (line 18).
  Remove the duplicate rule from the Guardrails section at
  line 212.

- **speckit-workflow/SKILL.md**: Move the "Branch Safety"
  section content to a new "Pre-conditions" section before
  "Reading tasks.md" (line 30). Remove the original section
  from lines 114-128.

### D3: Content preservation with minor formatting

The constraint text is moved, not rewritten. Minor formatting
adjustments (heading level changes from ## to ###, or adding
bold emphasis) are acceptable for structural consistency.

## Risks / Trade-offs

### Low risk: content duplication

If the original text is not fully removed from the Guardrails
section, constraints could appear twice. Mitigated by explicit
task steps to remove the original text after adding the
pre-condition block.

### Low risk: heading hierarchy disruption

Adding a new section may shift the document outline. Mitigated
by using appropriate heading levels (### within ## sections)
and verifying the document reads coherently after the change.

### Accepted trade-off: longer preamble before action

Moving constraints earlier means agents read more text before
reaching actionable instructions. This is the correct trade-off
— safety constraints MUST be processed before actions, even at
the cost of slightly longer preamble.
