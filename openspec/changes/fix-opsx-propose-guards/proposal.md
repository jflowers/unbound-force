## Why

The `opsx-propose` command and `openspec-propose` skill contain two
structural gaps that allow safety guards to be bypassed under context
compression (issue #353, related to root cause analysis in #346):

1. **Gap A -- Dirty-tree guard is prose only**: The dirty working tree
   check (lines 44-64) describes a multi-condition check before
   `git checkout -b` in prose, but never specifies an explicit
   `AskUserQuestion` tool call. Under context compression the guard
   can be skipped entirely, allowing branch creation despite
   uncommitted changes.

2. **Gap B -- STOP HERE placement**: The "STOP HERE. Do NOT proceed
   to implementation." rule at line 131 appears AFTER the full
   artifact-creation workflow (lines 94-126). The rule that governs
   when to stop appears after the actions it should gate, making it
   ineffective under context compression.

These are the same class of vulnerability identified in issue #346:
prose-only guards that lack explicit tool enforcement, and rules
placed after the workflow they should constrain.

## What Changes

### Two files affected

Both `.opencode/commands/opsx-propose.md` and
`.opencode/skills/openspec-propose/SKILL.md` receive identical
structural fixes:

1. **Gap A fix**: Add an explicit `AskUserQuestion` tool call with
   concrete options (`["Stash changes and continue", "Abort"]`) after
   dirty-tree detection, replacing prose-only instructions.

2. **Gap B fix**: Add a bolded preamble guard at the top of the Steps
   section (before Step 1) that states the STOP HERE rule, ensuring
   the constraint is loaded before the workflow it governs. The
   existing STOP HERE block after Step 6 is retained as reinforcement.

## Capabilities

### New Capabilities

- None (this is a hardening fix, not a feature addition)

### Modified Capabilities

- `opsx-propose dirty-tree guard`: Upgraded from prose-only
  description to explicit AskUserQuestion enforcement with concrete
  options
- `opsx-propose stop-gate`: Duplicated as a preamble before the
  workflow steps, ensuring the constraint survives context compression

### Removed Capabilities

- None

## Impact

- **Files**: `.opencode/commands/opsx-propose.md`,
  `.opencode/skills/openspec-propose/SKILL.md`
- **Behavior**: No functional change for agents that already follow
  the prose instructions. Agents under context compression will now
  see explicit tool calls and early-loaded constraints.
- **Risk**: Low. These are agent instruction files, not source code.
  Changes are additive (new AskUserQuestion block, new preamble) with
  no removal of existing instructions.
- **Testing**: Structural verification that the preamble appears
  before `**Steps**`, that `AskUserQuestion` with two options
  appears in the dirty-tree guard section, and that the STOP HERE
  block after Step 6 is retained. Additionally, manual behavioral
  verification by running `/opsx-propose` with a dirty working
  tree and confirming the AskUserQuestion prompt fires. Note:
  agent instruction files (Markdown) cannot be unit-tested in the
  traditional sense -- structural verification plus manual
  behavioral testing constitute the coverage strategy for this
  change type.
- **Follow-up**: Other commands (`speckit.specify.md`,
  `cobalt-crush.md`) have the same prose-only dirty-tree guard
  pattern and should be assessed for the same vulnerability in
  a separate change.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent workflow instructions, not inter-hero
artifact communication. No artifact formats or exchange protocols
are affected.

### II. Composability First

**Assessment**: N/A

No dependencies are introduced or modified. Both files remain
self-contained agent instructions.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable outputs or provenance metadata are affected.
This change is purely about agent instruction robustness.

### IV. Testability

**Assessment**: PASS

The fix can be verified by running `/opsx-propose` with a dirty
working tree and confirming the explicit AskUserQuestion prompt
fires. No external services required.

### V. Security by Default

**Assessment**: PASS

This change directly improves security posture by hardening a
guard against context-compression bypass. The dirty-tree check
prevents uncommitted work from being silently applied to the
wrong branch -- a data integrity concern. Explicit tool
enforcement replaces prose-only instructions that could be
skipped.
