## Why

Across 18 files (12 commands, 1 agent, 5 skills), interactive
confirmation gates reference **`AskUserQuestion tool`** — a tool
name that does not exist in OpenCode's tool registry. The actual
tool is named **`question`**.

When an agent reads these instructions literally and looks for a
tool named `AskUserQuestion`, it may:
- Silently skip the interactive gate entirely (most likely)
- Map it to the `question` tool by inference (best case)
- Fail with an error about a missing tool

This was identified during triage of #465 where the agent skipped
all interactive gates in `uf.triage-issue.md` Phase 4. Fixing the
tool name is a defense-in-depth measure alongside #473 (guardrail
hardening) and #474 (mandatory gate markers).

Additionally, the embedded scaffold assets under
`internal/scaffold/assets/opencode/` contain the same stale
references in 6 files and must be updated in lockstep to maintain
drift detection parity.

Fixes #475.

## What Changes

Rename all occurrences of `AskUserQuestion tool` (and variants
like `AskUserQuestion`) to `question tool` across all affected
files. This is a mechanical search-and-replace with no functional
changes to gate logic.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `interactive-gates`: All 18 command/agent/skill files now
  reference the correct OpenCode tool name (`question`), improving
  agent compliance with interactive confirmation gates.

### Removed Capabilities
- None

## Impact

- **Commands** (12 files): `uf.triage-issue.md`,
  `uf.address-feedback.md`, `uf.review-council.md`,
  `uf.review-pr.md`, `uf.finale.md`, `opsx-propose.md`,
  `opsx-apply.md`, `opsx-archive.md`, `speckit.clarify.md`,
  `speckit.implement.md`, `speckit.specify.md`,
  `muti-mind.sync-push.md`
- **Agents** (1 file): `muti-mind-po.md`
- **Skills** (5 files): `openspec-apply-change/SKILL.md`,
  `openspec-explore/SKILL.md`, `speckit-workflow/SKILL.md`,
  `openspec-archive-change/SKILL.md`,
  `openspec-propose/SKILL.md`
- **Scaffold assets** (6 files): Embedded copies under
  `internal/scaffold/assets/opencode/` must be updated in
  lockstep to maintain drift detection parity.
- **Total**: 24 files, 73 occurrences (source) + 42
  occurrences (scaffold assets) = 115 total
- **Risk**: Very low — text-only changes to tool name references,
  no logic changes

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies instruction text within agent prompts. It
does not affect artifact-based communication or inter-hero
collaboration patterns.

### II. Composability First

**Assessment**: N/A

No dependencies are added or removed. Each file remains
independently functional. The change is purely cosmetic to
the tool name reference.

### III. Observable Quality

**Assessment**: N/A

No output formats, provenance metadata, or machine-parseable
artifacts are affected. This change modifies agent instruction
files only.

### IV. Testability

**Assessment**: PASS

Drift detection tests verify that `.opencode/` source files
match their embedded copies under `internal/scaffold/assets/`.
Both sets of files are updated in lockstep, maintaining test
parity. No new code is introduced that would require coverage.

### V. Security by Default

**Assessment**: N/A

No dependencies, inputs, permissions, or security-sensitive
operations are affected.
