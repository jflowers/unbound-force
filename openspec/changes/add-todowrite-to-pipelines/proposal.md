## Why

Pipeline commands (`/uf.unleash`, `/uf.finale`, `/uf.review-council`,
`/uf.address-feedback`) use an embedded execution checklist maintained
via the Edit tool for resumability after context compression. However,
they do not instruct the agent to also use the `TodoWrite` tool for
live session visibility. The result: users see no progress indicators
in the UI during multi-step pipeline execution.

This was observed during an `opsx/add-dcp-config` session where
`/uf.finale` executed all 8 steps with zero TodoWrite tracking.

Fixes [#504](https://github.com/unbound-force/unbound-force/issues/504).

## What Changes

Add explicit TodoWrite instructions to all pipeline command templates
that use an embedded execution checklist. Each command will instruct
the agent to:

1. Initialize a TodoWrite list at pipeline start with all steps as
   `pending`
2. Mark each step `in_progress` before starting it and `completed`
   after it finishes
3. Continue using the Edit tool checklist for resumability — the two
   mechanisms serve complementary purposes

## Capabilities

### New Capabilities
- `pipeline-todowrite-visibility`: All pipeline commands provide
  real-time progress visibility to the user via TodoWrite alongside
  the existing Edit tool checklist for resumability

### Modified Capabilities
- `/uf.unleash`: Adds TodoWrite tracking for its 11-step pipeline
  (Steps 0-10)
- `/uf.finale`: Adds TodoWrite tracking for its 8-step pipeline
  (Steps 1-8)
- `/uf.review-council`: Adds TodoWrite tracking for its multi-phase
  review pipeline
- `/uf.address-feedback`: Adds TodoWrite tracking for its 4-phase
  feedback pipeline

### Removed Capabilities
- None

## Impact

- **Affected files**:
  - `.opencode/commands/uf.unleash.md`
  - `.opencode/commands/uf.finale.md`
  - `.opencode/commands/uf.review-council.md`
  - `.opencode/commands/uf.address-feedback.md`
- **No code changes** — this is a command template update only
- **No breaking changes** — the Edit tool checklist continues to
  function as before; TodoWrite is additive
- **Downstream impact** — these templates are propagated to all
  scaffolded projects via `replicator init`, so the fix benefits
  the entire ecosystem

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent command templates, not inter-hero
artifact communication. The artifact envelope format and
self-describing output requirements are unaffected.

### II. Composability First

**Assessment**: PASS

TodoWrite is a built-in OpenCode capability available in all
sessions. No new dependencies are introduced. Each command
remains independently usable — the TodoWrite instructions
enhance the user experience without requiring any additional
hero or tool to be deployed.

### III. Observable Quality

**Assessment**: PASS

This change directly improves observability by adding real-time
progress visibility to pipeline execution. Users gain live
feedback on which step is executing, which is a form of
operational observability for the agent workflow.

### IV. Testability

**Assessment**: PASS

Command templates are declarative agent instructions (Markdown),
not executable code. However, the existing `TestEmbeddedAssets_MatchSource`
drift-detection test enforces byte-identity between canonical command
files and their scaffold copies, providing automated verification
of template integrity. The tasks include grep-based verification
of TodoWrite instruction presence (task 2.1) and a scaffold drift
test run (task 2.3).

### V. Security by Default

**Assessment**: N/A

No external inputs, dependencies, or privilege boundaries are
affected. TodoWrite is a session-local UI mechanism with no
security implications.
