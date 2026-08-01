## Why

When OpenCode's context compression is enabled during a `/uf.unleash`
session, the 661-line command template is injected as conversation
content and becomes subject to compression heuristics. The 8-step
autonomous pipeline (clarify, plan, tasks, spec review, implement,
code review, retrospective, demo) spans many tool calls and subagent
delegations. Compression can fire between steps, discarding procedural
instructions while preserving only data summaries.

This causes four failure modes (GitHub issue #380):

1. **Resumability detection misread** -- the agent loses awareness of
   which step it is currently executing, potentially misinterpreting
   intermediate state as complete and skipping partially-done steps.
2. **Phase checkpoint hard-gate skipped** -- the agent loses awareness
   that a pre-flight checkpoint is required before proceeding to the
   next phase, advancing without verifying build and tests pass.
3. **Parallel worker batch state lost** -- the agent loses track of
   which workers in a batch have completed, potentially double-executing
   tasks or incorrectly reporting batches as complete.
4. **Fix loop iteration count lost** -- the agent loses the iteration
   counter for spec review and code review fix loops, potentially
   exceeding the 3-iteration limit or skipping remaining iterations.

The root cause is the same as issue #373 (`/uf.review-pr`): the command
template is injected as conversation content, making it subject to the
same compression heuristics as tool output and intermediate results.

## What Changes

Add compression resilience to the `/uf.unleash` command template using
the same three-part remediation pattern proposed for `/uf.review-pr`
in issue #373:

1. **Session-resume guard** -- a blockquote at the top of the file
   instructing the agent to re-read the template on resume and rely
   only on filesystem markers (checkboxes, HTML comment markers) for
   resumability, never compressed context summaries.

2. **Execution checklist with Edit tool instruction** -- a live
   checklist the agent updates in-place using the Edit tool as each
   step completes. Includes iteration count and current phase as inline
   state (e.g., `Step 5: Implement -- Phase 2/3, iteration 1/3`).

3. **Step-level checkpoint reminders** -- one-line checkpoint at the
   end of each step and phase boundary reminding the agent to mark the
   checklist before proceeding.

## Capabilities

### New Capabilities
- `compression-resilient-state`: Pipeline execution state survives
  context compression events via in-conversation checklist that the
  agent maintains with Edit tool operations
- `session-resume-guard`: Explicit instructions preventing the agent
  from inferring step completion from compressed summaries

### Modified Capabilities
- `resumability-detection`: Enhanced with explicit guard against
  treating compressed context as authoritative state source
- `phase-checkpoints`: Each phase boundary now includes a checkpoint
  reminder to update the execution checklist
- `fix-loop-tracking`: Iteration counters for spec review and code
  review loops are maintained in the execution checklist

### Removed Capabilities
- None

## Impact

- **Files**: `.opencode/commands/uf.unleash.md` and its scaffold copy
  at `internal/scaffold/assets/opencode/commands/uf.unleash.md`
- **Behavior**: No change to pipeline logic or step ordering. The
  additions are purely defensive -- they add state tracking and
  checkpoint reminders that are harmless when compression is disabled
  and essential when compression is enabled.
- **Testing**: Existing drift detection tests verify the scaffold copy
  matches the canonical source. No new test functions needed since the
  change is to a Markdown command template, not Go source code.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: PASS

This change strengthens artifact-based collaboration. The execution
checklist is itself an artifact -- an in-conversation state record
that the agent maintains via Edit tool operations. The filesystem
markers (`<!-- spec-review: passed -->`, `<!-- code-review: passed -->`,
task checkboxes) remain the authoritative resumability state, and the
session-resume guard explicitly reinforces this artifact-first pattern.

### II. Composability First

**Assessment**: N/A

This change modifies only the `/uf.unleash` command template. It does
not introduce dependencies between heroes or affect standalone
hero functionality.

### III. Observable Quality

**Assessment**: PASS

The execution checklist makes pipeline progress observable within the
conversation. Step completion, phase counts, and iteration numbers
are tracked explicitly rather than inferred from compressed context.

### IV. Testability

**Assessment**: PASS

The change is to a Markdown command template. Existing drift detection
tests in the scaffold package verify that the scaffold copy matches
the canonical source. The template modifications are testable by
verifying the guard text, checklist, and checkpoint reminders exist
in the file.

### V. Security by Default

**Assessment**: N/A

This change does not affect supply chain integrity, input validation,
or privilege boundaries. It modifies only conversational instructions
within a command template.
