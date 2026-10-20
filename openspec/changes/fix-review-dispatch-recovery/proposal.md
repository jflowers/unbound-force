<!-- `originating_issue: 751` is set in .openspec.yaml so
     /uf.finale emits `Closes #751` in the PR body. -->

## Why

A failed child run with already-accepted submissions permanently
bricks dispatch finalization (issue #751). On 2026-10-19 a
`/uf.review-council` spec-review dispatch (correlation
`4ae8aa2b-9b6e-4427-88e1-367198eb6a86`) ran 5 reviewers; 4
succeeded or submitted, 2 were recorded `failed`. divisor-guard
completed its review normally — `submit_review_findings`
accepted 6 findings, `submit_lesson_proposal` accepted 1
proposal, and it began its final review text — then its session
hit the model context ceiling (~363k input tokens) while
generating that final response. The run was recorded `failed`
while the accepted submissions persisted, attributed to the
failed run.

`consolidate_dispatch` harvested and included those failed-run
findings in the payload it builds, and the finalizer —
correctly, per fail-closed integrity rules (RD-FR-007: failed
runs MUST NOT vote or emit findings) — rejected that payload
three times (`non-success run ... must not vote or emit
findings`, `consolidated finding references a non-successful or
unknown run`, `consolidated finding has incorrect contributing
run ids`). No sanctioned recovery exists: there is no way to
discard orphaned submissions, no partial re-dispatch of failed
reviewers, and retrying `consolidate_dispatch` is pointless
because the persisted state never changes. The net effect: 3
successful reviews (9 findings, 5 lesson proposals) were
stranded, the caller had to fail closed `INCONCLUSIVE`, block
automation, and request human review. The same finalizer
rejection recurred in at least 5 more sessions between
2026-10-14 and 2026-10-17 (one exhausting all retries).

The finalizer's integrity rules are correct and stay unchanged.
The missing piece is a recovery path: consolidation must not
emit payloads its own finalizer rejects, and a run that
completed its structured work must not be bricked by a
post-submission session abort.

## What Changes

1. **Success-scoped consolidation**: `consolidate_dispatch`
   builds its finalization payload from successful runs only.
   Findings and proposals harvested from non-success runs are
   excluded from the payload and surfaced in an explicit,
   machine-readable warning (agent, run id, counts) — never
   silently dropped. Finalizer validation rules are untouched.
2. **Post-submission completion status**: a child run that
   delivered its structured submissions and its final review
   text is recorded as completed rather than `failed` when the
   underlying session aborts afterward (the divisor-guard
   case). A run that aborts before submitting remains `failed`
   with its error.
3. **Recovery operations**: an explicit discard action for
   orphaned submissions of failed runs, and partial re-dispatch
   of only the failed reviewers within the same dispatch
   session (reusing sibling evidence and plan), so one child
   context blowout no longer bricks the whole dispatch.
4. **Child token-budget observability**: per-run input-token
   usage from persisted run data is surfaced in
   `dispatch_status` output so context-exhaustion failures are
   diagnosable. Prompt/evidence trimming is tracked in #770, not
   implemented here.

## Capabilities

### New Capabilities
- `dispatch-recovery`: Explicit recovery operations for
  dispatch sessions containing failed runs — discard of
  orphaned submissions and partial re-dispatch of failed
  reviewers within the same session.

### Modified Capabilities
- `review-dispatch`: Consolidation scopes the finalization
  payload to successful runs with explicit orphan-submission
  warnings; run status derivation recognizes
  post-submission completion; submit-tool harvest and run-file
  persistence separate accepted submissions from run status.

### Removed Capabilities
- None.

## Impact

- **Code**: `.opencode/plugins/review-dispatch/index.ts`
  (consolidation, dispatch run harvest, dispatch_status,
  recovery tooling; post-submission status derivation lives
  in the plugin's `shouldReclassifyToSuccess` —
  `.opencode/lib/agent-executor.ts` is untouched) and its
  scaffold twin
  `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
  (synced byte-identical per the scaffold-parity obligation).
  No Go code changes.
- **Tests**: `.opencode/test/` suite (consolidate-dispatch,
  dispatch-agent-run, dispatch-status, dispatch-recovery —
  the new 23-test flagship recovery suite —
  finalize-error-boundaries, plugin-integration,
  scratch-smoke) via `make plugin-test`.
- **Consumers**: `/uf.review-council`, `/uf.review-pr`,
  `/uf.triage-issue`, `/uf.address-feedback`, and
  `/uf.unleash` review gates gain a recovery path instead of
  dead-ending at `INCONCLUSIVE`.
- **Behavior preserved**: fail-closed finalization semantics
  (RD-FR-007), verdict computation, and the review-verdict
  artifact format are unchanged; no quality or governance gate
  is weakened.
- **Depends on**: `review-council-multi-model-fanout`
  (currently unarchived). The spec deltas cite RD-FR-007
  (fail-closed no-success), which that change defines; this
  change MUST archive after `fanout` does, so the referenced
  requirement already exists in the spec registry when these
  deltas land.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

Recovery operations and orphan-submission warnings are
self-describing artifacts carried in the dispatch payload and
tool output (agent, run id, counts, correlation id), so parent
commands and humans can act on them without runtime coupling
to plugin internals.

### II. Composability First

**Assessment**: PASS

Each fix is independently valuable: success-scoped
consolidation alone unblocks finalization; status derivation
alone prevents the guard-case misclassification; recovery
operations alone unbrick existing sessions. No new mandatory
dependency is introduced.

### III. Observable Quality

**Assessment**: PASS

Orphan-submission exclusions are emitted as machine-parseable
warnings with provenance (run id, agent, counts);
`dispatch_status` surfaces per-run token usage. Existing
envelope and verdict formats remain stable and unchanged.

### IV. Testability

**Assessment**: PASS

All changes are TypeScript plugin logic testable in isolation
with the existing vitest suite and in-memory submission store;
scenarios reproduce the #751 failure chain (failed run with
accepted submissions) without external services. The coverage
strategy is defined in tasks.md and enforced by
`make plugin-test` / `make check`.

### V. Security by Default

**Assessment**: PASS

No new dependencies, no new external inputs, no privilege
changes. Recovery actions validate against the dispatch
session's persisted plan and only mutate that session's
run-store files under the existing OS temp directory with
existing restrictive permissions.

### VI. Deterministic Execution

**Assessment**: PASS

Recovery, status derivation, and success-scoped consolidation
are mechanical procedures implemented as executable plugin
tools with tests rather than procedural prose in commands;
output formats at the new decision points (warnings, recovery
results) are tool-rendered with examples preserved in the
spec scenarios.

<!-- scaffolded by uf vdev -->
