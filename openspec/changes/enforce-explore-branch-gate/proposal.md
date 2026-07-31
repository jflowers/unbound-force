## Why

The `openspec-explore/SKILL.md` contains a guardrail at line 330 that says
"Don't switch branches without confirmation." This is advisory prose only --
there is no enforced `AskUserQuestion` tool call before branch creation. When
exploration naturally leads to recommending `/opsx-propose`, an agent in
explore mode can transition to branch creation without explicit user consent.

This was identified in issue #362 as part of the parent audit (issue #346)
that discovered confirmation gates expressed as prose are routinely bypassed
by agents, especially under compressed/resumed session context.

The fix converts the advisory guardrail into an enforced gate by requiring
an explicit `AskUserQuestion` tool call with confirmation options before any
branch creation or switching occurs from explore mode.

## What Changes

### Modified Capabilities
- `openspec-explore skill`: The branch-switching guardrail is replaced with
  an explicit, enforceable confirmation gate that requires `AskUserQuestion`
  before any `git checkout -b` or `/opsx-propose` transition from explore
  mode.

### New Capabilities
- None

### Removed Capabilities
- None

## Impact

- **File**: `.opencode/skills/openspec-explore/SKILL.md` (single file change)
- **Behavior**: Agents in explore mode will be required to present the
  proposed branch name to the user and use `AskUserQuestion` with explicit
  options before creating a branch or transitioning to proposal mode.
- **Risk**: Low. This is a skill file text change only -- no Go code, no
  CLI changes, no schema changes.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent skill instructions, not inter-hero artifact
communication or runtime coupling. No impact on artifact-based collaboration.

### II. Composability First

**Assessment**: N/A

This change is internal to the openspec-explore skill. It does not affect
hero installability, extension points, or standalone functionality.

### III. Observable Quality

**Assessment**: PASS

The enforcement claim ("enforced gate" vs. "advisory guardrail") is
verifiable via structural text analysis of the SKILL.md file -- the
presence of `AskUserQuestion` in numbered steps within the Guardrails
section constitutes reproducible evidence of enforcement.

### IV. Testability

**Assessment**: PASS

The enforced gate is structurally verifiable: reviewers can confirm the
`AskUserQuestion` requirement is present as explicit instructions rather
than advisory prose. The gate's presence is a textual property of the
skill file, not a runtime behavior requiring integration tests.

### V. Security by Default

**Assessment**: PASS

This change strengthens security posture by preventing unauthorized branch
switching. It enforces least-privilege: the agent must not take irreversible
actions (branch creation) without explicit user authorization.
