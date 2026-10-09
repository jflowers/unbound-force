## ADDED Requirements

### Requirement: FR-001 dispatch_review_runs tool

The review-dispatch plugin MUST register a
`dispatch_review_runs` tool that aggregates evidence
acquisition, prompt building, and agent dispatching into
a single deterministic tool call.

### Requirement: FR-002 Input schema

The tool MUST accept the following input parameters:

- `mode` (string, required): Review mode (`code`,
  `specs`, `triage`, or `feedback`).
- `command` (string, required): Calling command name
  (`review-council`, `review-pr`, `triage-issue`,
  `address-feedback`, `speckit-testreview`).
- `diff_path` (string, required): Absolute path to the
  saved diff file on disk.
- `changed_files` (string, required): Pre-formatted list
  of changed file paths with addition/deletion counts.
- `input_context` (string, required): Serialized
  base/head ref information.
- `plan_entries` (array, required): Included plan entries
  from `plan_review_dispatch` output. Each entry MUST
  include agent, source, sequence, model, variant,
  read_only, and tier fields.
- `max_parallel_runs` (number, required): Maximum
  parallel batch size from the plan limits.
- `budget_usd` (number, optional): Maximum cumulative
  cost in USD from the plan limits.
- `per_run_timeout_ms` (number, optional): Per-run
  timeout in milliseconds from the plan limits.
- `session_metadata` (object, required): Session metadata
  matching `SessionMetadataSchema` (command, mode, full,
  input_context, change_profile, plan, coverage).
- `pre_flight_results` (string, optional): Formatted
  pre-flight check output.
- `existing_reviews` (string, optional): Existing review
  state.
- `walkthrough` (string, optional): PR walkthrough text.
- `review_context` (string, optional): Spec artifacts,
  linked issues, or other review context.

#### Scenario: All required inputs provided

- **GIVEN** valid `mode`, `command`, `diff_path`,
  `changed_files`, `input_context`, `plan_entries`,
  `max_parallel_runs`, and `session_metadata`
- **WHEN** `dispatch_review_runs` is called
- **THEN** the tool acquires sibling evidence, builds
  prompt files, dispatches all included runs, and returns
  a compact summary

### Requirement: FR-003 Output schema

The tool MUST return a JSON object with shape:
```
{
  status: "ok" | "error",
  runs_completed: number,
  runs_failed: number,
  runs_skipped: number,
  findings: number,
  proposals: number,
  warnings: string[]
}
```

When `status` is `error`, the tool MUST include `message`
and `retryable` fields.

#### Scenario: Successful dispatch of 5 agents

- **GIVEN** 5 plan entries with decision `include`
- **WHEN** all 5 runs complete successfully
- **THEN** output has `status: "ok"`,
  `runs_completed: 5`, `runs_failed: 0`,
  `runs_skipped: 0`

#### Scenario: Partial failure

- **GIVEN** 5 plan entries
- **WHEN** 3 succeed and 2 fail
- **THEN** output has `runs_completed: 3`,
  `runs_failed: 2`, `runs_skipped: 0`

### Requirement: FR-004 Internal sequencing

The tool MUST execute internally in this order:

1. Call `acquireSiblingEvidence` to fetch cross-repo
   evidence.
2. Call `buildReviewPrompts` to assemble per-agent prompt
   files, passing the acquired evidence.
3. Dispatch runs via `dispatchAgentRun` for each included
   plan entry in parallel batches.

Step 2 MUST NOT start before Step 1 completes. Step 3
MUST NOT start before Step 2 completes.

#### Scenario: Evidence acquired before prompts built

- **GIVEN** sibling evidence acquisition succeeds
- **WHEN** prompt building starts
- **THEN** the evidence content is included in each
  prompt file

### Requirement: FR-005 Parallel batch execution

The tool MUST dispatch runs in batches no larger than
`max_parallel_runs`. Within a batch, all runs execute
concurrently via `Promise.all` (or equivalent). Between
batches, the tool MUST check cumulative cost against
`budget_usd` when provided.

#### Scenario: Batch size respected

- **GIVEN** 5 plan entries and `max_parallel_runs: 4`
- **WHEN** the tool dispatches runs
- **THEN** batch 1 contains 4 runs (concurrent), batch 2
  contains 1 run

#### Scenario: Budget exceeded between batches

- **GIVEN** 5 plan entries, `budget_usd: 5.0`, and the
  first batch costs $6.00
- **WHEN** the tool checks budget after batch 1
- **THEN** remaining runs are terminal-skipped with
  status `budget_skipped`

### Requirement: FR-006 Error isolation

One failed run MUST NOT cancel independent runs. The tool
MUST continue dispatching remaining runs even when
individual runs fail.

#### Scenario: First run fails, others succeed

- **GIVEN** 5 plan entries
- **WHEN** the first run fails with a model error
- **THEN** the remaining 4 runs still execute and their
  results are persisted

### Requirement: FR-007 Session metadata passthrough

The tool MUST pass `session_metadata` to the first
internal `dispatchAgentRun` call. Subsequent calls MUST
NOT pass `session_metadata` (matching the existing
first-call pattern).

#### Scenario: Metadata persisted once

- **GIVEN** `session_metadata` is provided
- **WHEN** 5 runs are dispatched
- **THEN** `session-metadata.json` is written once during
  the first run and reused by `consolidate_dispatch`

### Requirement: FR-008 Tool registration

The tool MUST be registered in
`ReviewDispatchPlugin.server()`. The total tool count
MUST increase from 10 to 11.

#### Scenario: Plugin registration

- **GIVEN** the review-dispatch plugin is initialized
- **WHEN** the plugin's tool list is inspected
- **THEN** `dispatch_review_runs` appears in the
  registered tools

### Requirement: FR-009 Dual-copy sync

The tool implementation MUST be maintained in both
`.opencode/plugins/review-dispatch/index.ts` and
`internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`.
Both copies MUST be byte-identical.

### Requirement: FR-010 Evidence acquisition failure

If `acquireSiblingEvidence` fails, the tool MUST still
attempt to build prompts and dispatch runs using empty
sibling evidence, rather than failing entirely. The
evidence failure MUST be recorded in the `warnings`
array of the output (see FR-003).

#### Scenario: Evidence unavailable

- **GIVEN** `acquireSiblingEvidence` returns an error
- **WHEN** the tool continues execution
- **THEN** prompt files are built with the empty-evidence
  marker and runs are dispatched normally

## MODIFIED Requirements

### Requirement: Command file dispatch steps

Previously: Command files described Steps 4c through 5
as a multi-step sequence: acquire sibling evidence, build
prompt files, dispatch each run individually in batches.
They also called `dispatch_status` before
`consolidate_dispatch`.

Modified: Command files SHOULD use `dispatch_review_runs`
for Steps 4c-5, collapsing the multi-step sequence into
one tool call. The redundant `dispatch_status` call
before `consolidate_dispatch` SHOULD be removed.

## REMOVED Requirements

None.
