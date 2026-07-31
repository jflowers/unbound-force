## Why

Three agent instruction files contain branch safety rules placed
at the END of the file, after all workflow instructions they govern
(Type T2 weakness). An agent following instructions sequentially
can reach and execute branch operations without ever seeing the
CRITICAL safety constraints.

This is a systemic issue identified during root cause analysis of
issue #346 (review-pr command skips Step 11 confirmation gate when
session context is compressed). The same T2 pattern appears in
three files:

- `cobalt-crush-dev.md` (#355) — no branch safety guardrails at all
- `openspec-apply-change/SKILL.md` (#359) — "NEVER switch branches"
  rule at line 212 of 219
- `speckit-workflow/SKILL.md` (#361) — "Branch Safety" section at
  line 114 of 148, after the full workflow

Fixes: #355, #359, #361

## What Changes

Elevate branch safety rules from end-of-file guardrails to
pre-condition blocks placed before the workflow instructions they
govern, ensuring agents encounter constraints before actions.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `cobalt-crush-dev agent`: Gains a Pre-conditions section with
  branch safety guardrails before the Code Implementation Checklist
- `openspec-apply-change skill`: Branch safety rule moved from
  Guardrails (line 212) to a Pre-condition block before Step 1
- `speckit-workflow skill`: Branch Safety section moved from end
  of file to a Pre-conditions section before "Reading tasks.md"

### Removed Capabilities
- None

## Impact

- **Files affected**: 3 agent/skill instruction files
  - `.opencode/agents/cobalt-crush-dev.md`
  - `.opencode/skills/openspec-apply-change/SKILL.md`
  - `.opencode/skills/speckit-workflow/SKILL.md`
- **Risk**: Low — text-only changes to agent instructions; no
  Go source code, no CI changes, no schema changes
- **Behavioral change**: Agents will encounter branch safety
  rules earlier in their instruction processing, reducing risk
  of branch operations with dirty working trees

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent instruction files (prompt engineering).
It does not alter artifact-based communication, output formats,
or inter-hero coordination.

### II. Composability First

**Assessment**: N/A

No changes to hero installation, standalone functionality, or
integration points. Agent instruction files are internal to
the meta repository.

### III. Observable Quality

**Assessment**: N/A

No changes to machine-parseable output, provenance metadata,
or quality metrics. This is a documentation/instruction fix.

### IV. Testability

**Assessment**: N/A

No code changes requiring test coverage. Agent instruction
files are not compiled or executed as code — they are prompt
engineering documents.

### V. Security by Default

**Assessment**: PASS

This change strengthens operational safety by ensuring branch
safety constraints are encountered before the actions they
govern, reducing the risk of data loss from uncommitted changes
being carried to the wrong branch.
