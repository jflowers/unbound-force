## ADDED Requirements

### Requirement: Workflow-Gate Marker Exception in Review-PR

The `/uf.review-pr` sub-agent MUST NOT flag the HTML comment markers `<!-- code-review: passed -->` and `<!-- spec-review: passed -->` as gatekeeping violations when they appear in files matching the paths `openspec/changes/*/tasks.md` or `specs/*/tasks.md` (relative to the repository root).

The exception MUST match ALL of the following conditions simultaneously:
1. The marker string is exactly `<!-- code-review: passed -->` or `<!-- spec-review: passed -->` (case-sensitive, exact match).
2. The file path matches `openspec/changes/*/tasks.md` or `specs/*/tasks.md`.

The sub-agent MUST continue to flag as gatekeeping violations:
- Any occurrence of these marker strings in files NOT matching the specified paths.
- Any other marker-like HTML comments in task files that are not the exact specified strings.
- Any real weakening of coverage thresholds, CI flags, severity definitions, convention rules, or constitution gates, regardless of file path.

#### Scenario: Legitimate code-review marker in OpenSpec task file

- **GIVEN** a PR diff includes a file at `openspec/changes/my-feature/tasks.md`
- **AND** that file contains the line `<!-- code-review: passed -->`
- **WHEN** `/uf.review-pr` analyzes the diff
- **THEN** the sub-agent MUST NOT produce a gatekeeping violation finding for that marker

#### Scenario: Legitimate spec-review marker in Speckit task file

- **GIVEN** a PR diff includes a file at `specs/001-auth/tasks.md`
- **AND** that file contains the line `<!-- spec-review: passed -->`
- **WHEN** `/uf.review-pr` analyzes the diff
- **THEN** the sub-agent MUST NOT produce a gatekeeping violation finding for that marker

#### Scenario: Marker in non-task file is still flagged

- **GIVEN** a PR diff includes a file at `AGENTS.md`
- **AND** that file contains the line `<!-- code-review: passed -->`
- **WHEN** `/uf.review-pr` analyzes the diff
- **THEN** the sub-agent MUST produce a gatekeeping violation finding for that marker

#### Scenario: Non-standard marker in task file is still flagged

- **GIVEN** a PR diff includes a file at `openspec/changes/my-feature/tasks.md`
- **AND** that file contains the line `<!-- coverage-threshold: lowered -->`
- **WHEN** `/uf.review-pr` analyzes the diff
- **THEN** the sub-agent MUST produce a gatekeeping violation finding for that marker

#### Scenario: Real gate weakening in task file is still flagged

- **GIVEN** a PR diff includes a file at `openspec/changes/my-feature/tasks.md`
- **AND** that diff modifies a coverage threshold value from `80` to `50`
- **WHEN** `/uf.review-pr` analyzes the diff
- **THEN** the sub-agent MUST produce a gatekeeping violation finding for the threshold modification

#### Scenario: Both markers present in same task file

- **GIVEN** a PR diff includes a file at `openspec/changes/my-feature/tasks.md`
- **AND** that file contains both `<!-- spec-review: passed -->` and `<!-- code-review: passed -->`
- **WHEN** `/uf.review-pr` analyzes the diff
- **THEN** the sub-agent MUST NOT produce any gatekeeping violation finding for either marker

### Requirement: Regression Test for Marker False Positive

The test suite MUST include a regression test that reproduces the false-positive scenario from GitHub issue #539 and asserts that the marker is no longer reported as a gatekeeping violation.

The regression test MUST structurally verify the prompt instruction by checking:
1. That the gatekeeping exception clause is present in the sub-agent prompt (structural verification via grep for the marker exception text in `review-pr.md`).
2. That the true-positive guardrails (negative control, path-negative control, MUST-still-flag guard) are preserved in the prompt.
3. That a non-standard marker in the same file path produces a finding (structural verification via grep for the negative control in the prompt).
4. That a marker in a non-task file path produces a finding (structural verification via grep for the path-negative control in the prompt).

#### Scenario: Regression test passes

- **GIVEN** the regression test fixture contains a diff with `<!-- code-review: passed -->` in `openspec/changes/test-feature/tasks.md`
- **WHEN** the regression test executes
- **THEN** the test MUST pass (assert no false positive) AND the negative control MUST pass (assert non-standard marker is still flagged)

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

<!-- scaffolded by uf vdev -->
