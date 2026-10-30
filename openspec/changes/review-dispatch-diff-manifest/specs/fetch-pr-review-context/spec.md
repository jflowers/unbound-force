<!-- capability: fetch-pr-review-context
     change: review-dispatch-diff-manifest
     originating_issue: 877 -->

## MODIFIED Requirements

### Requirement: FR-006 Pre-computed fields

The tool MUST pre-compute these fields from raw PR data:

- `input_context`: formatted string containing kind, PR
  number, base/head refs and SHAs
- `changed_files`: formatted list of changed files with
  additions/deletions counts
- `exceeds_threshold`: true when the diff exceeds 1500
  lines (`DIFF_THRESHOLD`), computed with the shared
  line-counting function from the review-diff-manifest lib
  module — the same function `build_review_prompts` uses
  for delivery-mode selection — so the field is true if
  and only if review dispatch engages manifest delivery
  (RD-FR-032)
- `ci_pending`: true when any CI check has `status` not
  equal to `completed`

Previously: `exceeds_threshold` marked the size advisory
threshold from command files (advisory-only, implying
degraded dispatch quality); it now marks the
manifest-delivery engagement threshold, and its line count
comes from the shared counting function so the
capture-path warning agrees with prompt-assembly mode
selection at the boundary.

#### Scenario: Boundary agreement with prompt assembly

- **GIVEN** a PR whose diff contains exactly 1500 lines
  and another containing exactly 1501 lines
- **WHEN** `fetch_pr_review_context` succeeds for both
- **THEN** the 1500-line diff reports `exceeds_threshold`
  false and the 1501-line diff reports it true
- **AND** `build_review_prompts` engages manifest mode for
  exactly the diffs for which `exceeds_threshold` is true
  (both computations use the shared counting function)

### Requirement: FR-010 Structured warnings

The tool MUST populate the `warnings` array in the output
when non-fatal issues are detected during execution:

- When `ci_pending` is true: include a warning with
  message indicating CI checks are still in progress.
- When `exceeds_threshold` is true: include a warning
  stating that the diff exceeds the size advisory
  threshold and that manifest delivery is engaged for the
  dispatch (reviewers retrieve diff content on demand via
  `read_diff_chunk`), preserving the substring "Diff
  exceeds size advisory threshold" so downstream substring
  matches keep working.
- When any `gh` sub-call returns partial data (e.g.,
  reviews fetch succeeds but inline comments fail): include
  a warning identifying the degraded field.

Warnings MUST be human-readable strings. An empty array
indicates no warnings.

Previously: the above-threshold warning noted only that
the diff exceeds the size advisory threshold, implying
degraded dispatch quality.

#### Scenario: CI checks pending warning

- **GIVEN** PR #100 has CI checks with `status: in_progress`
- **WHEN** `fetch_pr_review_context` succeeds
- **THEN** `warnings` contains a string matching
  "CI checks are still in progress"

#### Scenario: Diff exceeds threshold warning

- **GIVEN** PR #200 has a diff exceeding 1500 lines
- **WHEN** `fetch_pr_review_context` succeeds
- **THEN** `warnings` contains a string matching
  "Diff exceeds size advisory threshold"
- **AND** that warning states that manifest delivery is
  engaged for the dispatch rather than implying degraded
  quality
