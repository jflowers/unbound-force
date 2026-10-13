## ADDED Requirements

### Requirement: Kind-Native Run Verdicts

FR-001: `consolidate_dispatch` MUST map every successful run's
`workflow_verdict` into the workflow-native enum of the session's
command kind before emitting runs or invoking the finalizer:
`VALID` / `INVALID` / `NEEDS-CLARIFICATION` for triage,
`ACCEPT` / `AUTHOR-DECIDES` for feedback, and the unchanged
generic verdict for council and test-review. The mapping MUST use
the existing lossless `workflowVerdictValue()` projection so that
run verdicts, the top-level `workflow_result.value`, and the
finalizer's `allowedRunVerdicts()` validation always agree.

#### Scenario: Triage internal-finalize succeeds
- **GIVEN** a dispatch session whose persisted metadata has
  `command: "triage-issue"` and at least one successful run with
  findings
- **WHEN** `consolidate_dispatch` is called with `provenance`
- **THEN** internal finalization succeeds with no
  "verdict outside triage" errors, and each emitted run carries a
  native triage verdict

#### Scenario: Returned payload is finalizer-valid
- **GIVEN** the same triage session
- **WHEN** `consolidate_dispatch` is called without provenance and
  its returned payload is submitted to `finalize_review_dispatch`
  unmodified
- **THEN** structural and semantic validation pass without any
  agent-side transformation of run verdicts

### Requirement: One-Call Command Finalization

FR-002: The triage, review-council, and address-feedback commands
MUST finalize every dispatch by a single `consolidate_dispatch`
call with `provenance` containing the current branch, the
current 40-character commit SHA, and a stable workflow id
(`uf.triage-issue`, `uf.review-council`, or
`uf.address-feedback`). The single-call mandate applies per
finalization attempt; a rejected attempt follows FR-004's
bounded mechanical-retry policy. Commands MUST NOT hand-assemble
the closed finalization payload, and MUST NOT restate or
recompute planner-owned or finalizer-owned fields.

#### Scenario: Command finalizes after mutations
- **GIVEN** a completed dispatch whose GitHub mutations and
  legacy artifacts are recorded
- **WHEN** the command reaches its finalization step
- **THEN** it issues a single `consolidate_dispatch` call with
  provenance and no reconstructed runs, findings, or run counts

### Requirement: Authoritative Finalizer Output

FR-003: Commands MUST treat the finalization result returned by
`consolidate_dispatch` as authoritative for the review-dispatch
artifact path, the canonical review-verdict v2 decision, and
whether calculated data is authoritative. Commands MUST NOT alter
tool-computed verdict, `verdict_reason`, run counts, findings, or
advisories. Action completion (labels, comments, child issues)
MUST be summarized in the terminal report and the legacy
issue-triage artifact, not in `verdict_reason`.

#### Scenario: Action outcomes reported outside the payload
- **GIVEN** a triage run where a label was applied and a comment
  posted
- **WHEN** finalization completes
- **THEN** `verdict_reason` remains the tool-computed text and the
  terminal report plus legacy artifact record the completed
  actions

### Requirement: Bounded Mechanical Retry

FR-004: When the finalizer rejects a payload for a mechanical
shape error (unknown key, enum-space mismatch, count mismatch),
the caller MAY correct the payload shape and retry at most twice.
Persistence failures, content failures, and exhausted retries
MUST follow the fail-closed path: retain the calculated assessment
only as non-authoritative human context, change the operation
result to failing `INCONCLUSIVE`, block automation, and request
human review. Assessment data (verdicts, findings, run states)
MUST NOT be altered to make validation pass.

Classification of a failure as mechanical is deterministic and
default-deny: a failure is mechanical only when the finalizer
rejects the submitted payload at its validation stage, reported
through the structured failure response as a rejected payload
with enumerated payload defects and no persisted artifact.
Persistence failures, content failures, tool or runtime errors,
and any failure whose class cannot be determined from the
failure response MUST be treated as non-mechanical. Retry
eligibility MUST NOT be inferred by pattern-matching
natural-language error text; indeterminate classification always
fails closed.

The no-alteration rule is enforced structurally on the one-call
path: `consolidate_dispatch` with provenance computes the
assessment data itself, leaving the caller no assembled payload
to alter. The MUST NOT binds any caller that hand-assembles or
transforms a finalization payload.

#### Scenario: Shape error retried then succeeds
- **GIVEN** a finalizer rejection listing only mechanical shape
  errors
- **WHEN** the caller corrects the shape and retries within the
  bound
- **THEN** finalization proceeds without changing any verdict,
  finding, or run state

#### Scenario: Exhausted retries fail closed
- **GIVEN** the initial attempt and both bounded retries were all
  rejected for mechanical shape errors
- **WHEN** the second retry is rejected
- **THEN** no further retry is attempted; the operation result
  becomes failing `INCONCLUSIVE`, automation is blocked, and the
  calculated assessment is retained only as non-authoritative
  human context

#### Scenario: Persistence failure fails closed
- **GIVEN** a finalizer persistence error
- **WHEN** the command handles it
- **THEN** the operation result becomes failing `INCONCLUSIVE`,
  automation is blocked, and no artifact or canonical decision is
  fabricated

#### Scenario: Indeterminate classification fails closed
- **GIVEN** a finalizer failure whose class cannot be determined
  from the structured failure response
- **WHEN** the command classifies the failure
- **THEN** the failure is treated as non-mechanical; no retry is
  attempted and the fail-closed path applies

#### Scenario: Error text alone does not grant retry eligibility
- **GIVEN** a failure whose natural-language error text resembles
  a mechanical shape error but whose structured response does not
  classify it as a validation-stage payload rejection
- **WHEN** the command classifies the failure
- **THEN** retry eligibility is not granted and the failure
  follows the fail-closed path

### Requirement: Scaffold Asset Parity

FR-005: Changes to `.opencode/plugins/review-dispatch/index.ts`
and to the three command files MUST be mirrored byte-identically
into `internal/scaffold/assets/opencode/`. Parity is verified by
the scaffold drift-detection tests in
`internal/scaffold/scaffold_test.go` (run under `make check`),
and `make build` MUST succeed so the embedded filesystem stays
in sync.

#### Scenario: Asset parity verified
- **GIVEN** the plugin and command edits are complete
- **WHEN** `make check` runs, including the scaffold
  drift-detection tests
- **THEN** the drift tests pass, scaffold assets match their
  `.opencode/` counterparts, and the build succeeds

### Requirement: Portable Issue Comment Pagination

FR-006: The issue-ingest instructions in uf.triage-issue.md MUST
use a `gh api --paginate` comment fetch that does not combine
`--slurp` with `--jq`, and MUST preserve numeric comment ids,
creation timestamps, and exact bodies across pages.

#### Scenario: Comments fetched on installed gh
- **GIVEN** an issue with comments and a gh CLI that rejects
  `--slurp` with `--jq`
- **WHEN** the documented fetch runs
- **THEN** all comments are retrieved with positive numeric ids
  and exact bodies, with no page dropped

### Requirement: Duplicate-Search Fallback

FR-007: The duplicate check in uf.triage-issue.md MUST define a
deterministic fallback: when the primary keyword search returns
zero results, retry exactly once with the two or three most
distinctive title keywords; record candidates from whichever
search produced them, or "none found" when both return none.

#### Scenario: Broad fallback finds candidates
- **GIVEN** a primary search over 5-10 keywords that returns an
  empty result
- **WHEN** the fallback search runs
- **THEN** the fallback candidates are recorded as
  `duplicate_candidates` without improvisation

### Requirement: Detached-HEAD Fail-Closed Provenance

FR-008: When resolving the branch for finalization provenance,
`git branch --show-current` returning empty output (detached
HEAD, common in CI) MUST cause the command to fail closed with
an explicit error. The command MUST NOT fabricate, default, or
omit the branch; an explicit branch checkout or resolution is
required before finalization proceeds. The error MUST name the
resolution (check out a named branch, or supply the branch
explicitly) so the failure is actionable in detached-HEAD CI
checkouts such as GitHub Actions `actions/checkout` defaults.

#### Scenario: Detached HEAD fails closed
- **GIVEN** a repository in detached HEAD state where
  `git branch --show-current` returns empty output
- **WHEN** the command resolves provenance for finalization
- **THEN** the command stops with an explicit error and does not
  call the finalizer with a fabricated or missing branch
