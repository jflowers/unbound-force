## Why

The "STOP HERE. Do NOT proceed to implementation." phase-boundary
gates in `speckit.tasks.md` and `speckit.plan.md` are positioned
AFTER the workflow steps they are meant to govern. This is a T2
weakness (CRITICAL/MANDATORY rule placed after the workflow it
governs) identified in the root cause analysis from issue #346.

A phase-boundary rule intended to prevent premature progression
to the next phase is only effective if the LLM encounters it
BEFORE executing the workflow that produces the artifacts. When
the STOP HERE block appears after the workflow steps, an LLM
with compressed context may execute the workflow and proceed
past the gate without ever processing the stop instruction.

Related issues confirm this is a recurring structural pattern:
- Issue #353: Same T2 pattern in `opsx-propose.md`
- Issue #355: Same T2 pattern in `cobalt-crush.md`

Additionally, the `uf-init.md` scaffold instruction (Step 10)
currently directs placement "after the main workflow
instructions, before the `## Guardrails` section" -- this
instruction itself perpetuates the T2 weakness and must also
be corrected to direct placement BEFORE the workflow steps.

## What Changes

Move the STOP HERE gate block to a position BEFORE the workflow
steps in both `speckit.tasks.md` and `speckit.plan.md`. Update
the `uf-init.md` Step 10 placement instruction so that future
scaffolding operations place STOP HERE blocks correctly.

## Capabilities

### New Capabilities

- None. This is a correctness fix, not a feature addition.

### Modified Capabilities

- `speckit.tasks`: STOP HERE gate moved to preamble position
  (after Outline heading, before Step 1)
- `speckit.plan`: STOP HERE gate moved to preamble position
  (after Outline heading, before Step 1)
- `uf-init` Step 10: Placement instruction updated from
  "after the main workflow instructions" to "immediately
  after the Outline heading, before the first numbered step"

### Removed Capabilities

- None.

## Impact

- **Files affected**: 3 files
  - `.opencode/commands/speckit.tasks.md`
  - `.opencode/commands/speckit.plan.md`
  - `.opencode/commands/uf-init.md`
- **Behavioral change**: LLMs processing these commands will
  encounter the STOP HERE instruction before executing any
  workflow steps, preventing premature phase progression.
- **No code changes**: This change affects only Markdown
  command files (agent instructions), not Go source code.
- **No CI impact**: No build, test, or lint changes needed.
- **Scaffold impact**: Future `uf init` runs will place
  STOP HERE blocks in the correct position for newly
  scaffolded files.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent instruction files, not artifact
formats or inter-hero communication. No impact on
artifact-based collaboration.

### II. Composability First

**Assessment**: N/A

No hero dependencies are introduced or modified. The change
is internal to command instruction files within this
meta-repository.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable output or provenance metadata is
affected. The change corrects instruction ordering in
Markdown files.

### IV. Testability

**Assessment**: PASS

The fix is verifiable by inspection: after the change,
the STOP HERE block must appear before the first numbered
workflow step in each affected file. The `uf-init.md`
placement instruction can be verified by reading its
updated text. No external services or shared state are
required for verification.

### V. Security by Default

**Assessment**: N/A

No dependencies, inputs, permissions, or supply chain
elements are affected.
