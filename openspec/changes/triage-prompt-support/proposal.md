## Why

`dispatch_review_runs` and `build_review_prompts` were built for
diff-based code review. Both require `diff_path` and
`changed_files` as mandatory string fields, hard-code diff-centric
prompt sections (## Diff, ## Changed Files), and emit a code-review
response contract (APPROVE / REQUEST CHANGES). Issue triage has
none of those inputs and needs a completely different verdict
vocabulary (VALID / INVALID / NEEDS-CLARIFICATION).

The result: `/uf.triage-issue` cannot call `dispatch_review_runs`
at all — the tool rejects the call at Zod parse time because the
required `diff_path` field is missing. Even if it could call the
tool, the child prompts would instruct agents to review a diff
that doesn't exist and render verdicts that are wrong for triage.

`plan_review_dispatch` and `consolidate_dispatch` are already
triage-aware (superRefine guards, `triageMajority()`, triage
workflow kind). Only the prompt-assembly and dispatch-invocation
layers need updating.

## What Changes

Make `build_review_prompts` and `dispatch_review_runs` triage-aware
by conditionally switching prompt sections, confinement rules, and
response contracts based on `mode`.

## Capabilities

### New Capabilities
- `issue_content` field: JSON string carrying issue title, body,
  comments, labels, and metadata — the primary input for triage
  child prompts (replaces the diff)
- `TRIAGE_CONFINEMENT_RULE`: Confines agents to issue content and
  repo context instead of diff lines
- `TRIAGE_RESPONSE_CONTRACT`: Requires VALID/INVALID/
  NEEDS-CLARIFICATION verdicts with category, objectivity,
  reasoning, and split recommendation fields
- `TRIAGE_PROHIBITIONS`: Triage-specific guardrails (no issue
  creation, no diff references)

### Modified Capabilities
- `BuildReviewPromptsInputSchema`: `diff_path` and `changed_files`
  become optional; `issue_content` added; superRefine enforces
  mutual exclusivity by mode
- `DispatchReviewRunsInputSchema`: same field changes
- `buildReviewPrompts()`: branches on `isTriageMode` for sections
  3/4/9/10/11; skips diff validation and file read for triage
- `uf.triage-issue.md`: Phase 2.3 rewritten to omit `diff_path`/
  `changed_files` and pass `issue_content` as JSON string

### Removed Capabilities
- None

## Impact

- **review-dispatch plugin**: ~120 lines added/changed in
  `review-dispatch/index.ts`
- **Command file**: `uf.triage-issue.md` Phase 2.3 rewrite (~20
  lines)
- **Tests**: ~180 lines of new tests across
  `build-review-prompts.test.ts` and `dispatch-review-runs.test.ts`
- **Scaffold sync**: canonical copies synced to
  `internal/scaffold/assets/opencode/`
- **No impact** on `/uf.review-council` or `/uf.review-pr` —
  non-triage modes still require `diff_path` and `changed_files`
  via superRefine; backward compatible
- **No impact** on `consolidate_dispatch`, `finalize_review_dispatch`,
  `fetch_pr_review_context`, or `plan_review_dispatch` — all either
  triage-aware already or PR-only

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

This change maintains artifact-based communication. Child agent
prompts remain self-describing text files with all context
embedded. The `issue_content` field is a self-contained JSON
string — no runtime coupling to GitHub APIs during prompt
assembly.

### II. Composability First

**Assessment**: PASS

`build_review_prompts` remains independently callable. The mode
branch adds triage support without removing existing code-review
functionality. Non-triage callers are unaffected.

### III. Observable Quality

**Assessment**: PASS

Child prompt files retain provenance metadata (agent name,
correlation ID, mode, command). Triage responses require the same
`**Model**` self-report and structured verdict format as code
review, ensuring machine-parseable output.

### IV. Testability

**Assessment**: PASS

All new behavior is covered by unit tests: triage mode produces
correct sections, rejects invalid input combinations, and
backward compatibility is verified. Tests run in isolation
without external services.
