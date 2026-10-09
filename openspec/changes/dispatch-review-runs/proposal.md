## Why

Session analysis of `/uf.review-pr` runs shows the
orchestrator making 7-8 sequential tool calls with zero
creative decisions between them:

```
acquire_sibling_evidence  → (no judgment)
build_review_prompts      → (no judgment)
dispatch_agent_run × N    → (no judgment)
```

Each call requires the LLM to process the previous
result, decide what to do next (always the same thing),
and construct the next call. Between these calls, the
agent spends 15-50 seconds "thinking" about what is
actually a deterministic pipeline.

Additionally, agents commonly call `dispatch_status`
before `consolidate_dispatch` in every session even though
`consolidate_dispatch` reads the same run files — this
is emergent agent behavior (not prescribed in command
files) that wastes tokens and time.

## What Changes

A new `dispatch_review_runs` tool in the review-dispatch
plugin that aggregates the evidence-acquisition,
prompt-building, and agent-dispatching phases into a
single deterministic tool call. Internally it calls
`acquire_sibling_evidence`, `build_review_prompts`, and
`dispatch_agent_run` for each included plan entry in
parallel batches.

Command files are updated to remove `dispatch_status`
calls that precede `consolidate_dispatch`, since the
consolidation tool already reads the same data.

## Capabilities

### New Capabilities
- `dispatch_review_runs`: Accepts plan entries, mode,
  command, diff path, changed files, input context, and
  session metadata. Internally acquires sibling evidence,
  builds per-agent prompt files, and dispatches all
  included runs in parallel batches. Returns a summary
  with runs completed, total findings, and total
  proposals. One tool call replaces 7-8 sequential calls.

### Modified Capabilities
- Command files (`uf.review-council`, `uf.review-pr`,
  `uf.triage-issue`, `uf.address-feedback`): Steps 4c
  through 5 collapse from multi-step sequences to a
  single `dispatch_review_runs` call. Redundant
  `dispatch_status` calls before consolidation are
  removed.

### Removed Capabilities
- None. Individual tools (`acquire_sibling_evidence`,
  `build_review_prompts`, `dispatch_agent_run`,
  `dispatch_status`) remain available for ad-hoc and
  debugging use.

## Impact

- **review-dispatch plugin**: New tool registered (11
  total). Internally calls existing tools/functions.
- **Command files**: ~50 lines of multi-step dispatch
  prose per command replaced by a single tool call.
- **Token savings**: ~100-150 tokens of inter-call
  reasoning eliminated per review session, plus ~15-50s
  of think time.
- **Dual-copy sync**: Both `.opencode/plugins/` and
  `internal/scaffold/assets/opencode/plugins/` copies.
- **Tests**: New test file + updated smoke/integration
  tests for tool count.
- **Documentation**: AGENTS.md project structure
  (plugin tool count), CHANGELOG.md entry for new tool
  and command file simplification. Documentation issue
  to be assessed at implementation time per the
  documentation gate.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The tool orchestrates existing artifact-producing tools
internally. Each child agent still receives a
self-contained prompt file and produces its own
structured output. The aggregation layer adds no runtime
coupling between heroes — it is a coordinator, not a
dependency.

### II. Composability First

**Assessment**: PASS

The aggregated tool is optional. Commands can still call
`acquire_sibling_evidence`, `build_review_prompts`, and
`dispatch_agent_run` individually. The tool composes
existing standalone functions; it does not introduce
mandatory dependencies.

### III. Observable Quality

**Assessment**: PASS

The tool returns structured JSON output with per-run
agent name, status, finding count, and proposal count.
All intermediate artifacts (prompt files, run JSON files,
session metadata) are persisted to disk and inspectable.
Provenance metadata flows through unchanged.

### IV. Testability

**Assessment**: PASS

The tool delegates to existing tested functions. Its own
tests verify the orchestration sequence: evidence
acquired, prompts built, runs dispatched, results
aggregated. All dependencies are injectable via the
existing factory pattern.

### V. Security by Default

**Assessment**: N/A

This change introduces no new external input surfaces,
dependencies, or privilege boundaries. The tool
orchestrates existing functions that already validate
their inputs. No new secrets, file permissions, or
shell execution paths are introduced. Supply chain
integrity is maintained through the existing dual-copy
sync and drift detection pattern.
