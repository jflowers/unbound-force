## Context

The review dispatch pipeline currently requires the
orchestrating agent to make 7-8 sequential tool calls with
no creative decisions between them: acquire sibling evidence,
build prompt files for each agent, then dispatch each agent
run. Agents also commonly call `dispatch_status` before
`consolidate_dispatch` even though consolidation reads the
same run files. This is emergent agent behavior (not
prescribed in command files) but is consistently observed
across sessions.

The `build_review_prompts` tool (from the prior change)
already eliminated prompt assembly reasoning. This change
aggregates the remaining sequential calls into a single
`dispatch_review_runs` tool, reducing the agent's dispatch
phase from ~8 calls to 1.

## Goals / Non-Goals

### Goals
- Aggregate evidence acquisition, prompt building, and run
  dispatching into a single deterministic tool call
- Reuse existing internal functions rather than reimplementing
  logic
- Respect `max_parallel_runs` and budget limits from the
  dispatch plan
- Remove redundant `dispatch_status` calls from command files
- Preserve individual tools for ad-hoc and debugging use

### Non-Goals
- Replacing `plan_review_dispatch` or `consolidate_dispatch`
  — those remain separate calls requiring agent judgment
  (plan configuration and provenance provision)
- Changing the dispatch plan format or session metadata schema
- Modifying child agent behavior or prompt content
- Aggregating the full pipeline end-to-end (plan → dispatch →
  consolidate → finalize) — the agent still decides when to
  plan, when to dispatch, and when to consolidate
- Including `speckit-testreview` as a consumer — that command
  uses a single-agent dispatch flow and does not benefit from
  the multi-run aggregation this tool provides

## Decisions

### D1: Composition over reimplementation

`dispatch_review_runs` calls existing internal functions
directly rather than reimplementing their logic:

- `acquireSiblingEvidence()` for evidence acquisition
- `buildReviewPrompts()` for prompt assembly
- `dispatchAgentRun()` for each run

This avoids code duplication and ensures behavior stays in
sync when individual tools are updated.

### D2: Session metadata passed on the first internal call

The tool passes `session_metadata` to the first
`dispatchAgentRun()` call internally, matching the existing
first-call pattern. The agent provides session_metadata once
to `dispatch_review_runs` and never thinks about it again.

### D3: Parallel batching from plan limits

The tool reads `max_parallel_runs` from the plan output and
dispatches runs in batches of that size. Between batches, it
checks cumulative cost against the plan budget. This matches
the command file specification for batch execution.

### D4: Budget and limit enforcement

If cumulative cost exceeds the plan budget between batches,
remaining runs are terminal-skipped with status
`budget_skipped`. If a run count limit is hit, remaining
runs are terminal-skipped with status `limit_skipped`. This
enforcement moves from prose instructions to deterministic
code.

### D5: Error isolation

One failed run MUST NOT cancel independent runs. The tool
continues dispatching remaining runs even when individual
runs fail, matching the command file specification. Failed
runs are recorded with their error but don't block the batch.

### D6: Minimal output for token efficiency

The tool returns a compact summary rather than echoing all
run details:

```json
{
  "status": "ok",
  "runs_completed": 5,
  "runs_failed": 0,
  "runs_skipped": 0,
  "findings": 12,
  "proposals": 1
}
```

Full run details are persisted to the dispatch session
directory and accessible via `consolidate_dispatch` or
`dispatch_status`.

### D7: Remove redundant dispatch_status

Command files currently call `dispatch_status` before
`consolidate_dispatch`. Since `consolidate_dispatch` reads
the same persisted run files, this is redundant. The command
file update removes these calls. `dispatch_status` remains
available for ad-hoc debugging.

## Risks / Trade-offs

### R1: Reduced observability during execution

The agent sees one tool call running for the full dispatch
duration (potentially minutes) instead of individual tool
calls completing sequentially. Mitigated by: the compact
summary output reports total runs/findings/proposals, and
`dispatch_status` remains available for mid-flight queries
in separate sessions.

### R2: Error recovery granularity

With individual calls, the agent could decide to proceed
without evidence on failure. The aggregated tool handles
this internally: if evidence acquisition fails, it proceeds
with empty sibling evidence rather than failing the entire
call (see FR-010). This graceful degradation is baked into
the tool, removing the need for agent-level error recovery
logic. Evidence acquisition rarely fails, and the tool
logs the failure in its `warnings` output.

### R3: Testing complexity

The tool orchestrates multiple internal functions. Tests
must verify the sequence and interaction patterns, not just
individual function behavior. Mitigated by: internal
functions are already individually tested; orchestration
tests focus on sequencing, batching, and error propagation.
