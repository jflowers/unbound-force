<!-- capability: gate-command
     change: unify-checknotonmain-with-the-shared-branch-resolution
     originating_issue: 938
     rationale: amends GATE-FR-008 so not-on-main consumes the
     once-per-run branch resolution GATE-FR-012 already mandates,
     replacing the check's own git rev-parse subprocess and the
     unconditional detached-HEAD pass documented previously
-->

Requirement numbering: this change modifies GATE-FR-008 (PR
phase checks); no new gate-command ids are allocated, and the
GATE-FR-013 through GATE-FR-099 reservation from
openspec/changes/uf-gate/ is unchanged. Under OpenSpec
replacement semantics this MODIFIED delta replaces the
requirement's prose and scenarios; the predecessor scenarios
are carried forward with the detached-HEAD scenario qualified,
the fails-on-main scenario extended with a provenance
assertion, and two scenarios added (recovered main ref, git
timeout). Requirement ids MUST stay inside the allocated
range.

## ADDED Requirements

None.

## MODIFIED Requirements

### Requirement: PR phase checks

**ID: GATE-FR-008** Amended — not-on-main consumes the shared
branch resolution.

When `--phase pr`, the gate MUST check:

- A review pass marker exists. The check looks for
  `<!-- code-review: passed -->` in tasks.md.
- The run's resolved branch is not `main` (no direct
  commits). The check MUST consume the once-per-run branch
  resolution shared by every check in the run
  (GATE-FR-012), including the CI-ref recovery for a
  detached HEAD, and MUST NOT spawn its own git process to
  re-detect the branch. The report's `branch` provenance
  field MUST record the same branch the check evaluated.
- When the resolution carries a branch-detection failure,
  the check MUST fail with the resolution's classified
  message, preserving the three failure classes: git
  unavailable (including a `uf doctor` hint), a
  bounded-timeout message naming the timeout bound, and a
  descriptive not-a-repository message (never a raw exec
  error).

#### Scenario: PR phase passes

- **GIVEN** the current git branch is `opsx/uf-gate`
  and tasks.md contains `<!-- code-review: passed -->`
- **WHEN** the user runs `uf gate --phase pr`
- **THEN** both `review-pass` and `not-on-main` checks
  pass

#### Scenario: PR phase fails on main

- **GIVEN** the current git branch is `main`
- **WHEN** the user runs `uf gate --phase pr`
- **THEN** the `not-on-main` check fails, the exit code
  is 1, and the report's `branch` field records `main`

#### Scenario: PR phase fails no review pass

- **GIVEN** the current git branch is `opsx/uf-gate`
  but tasks.md has no `<!-- code-review: passed -->`
  marker
- **WHEN** the user runs `uf gate --phase pr`
- **THEN** the `review-pass` check fails

#### Scenario: Git not available

- **GIVEN** `git` is not in PATH
- **WHEN** the user runs `uf gate --phase pr`
- **THEN** the `not-on-main` check fails with a message
  suggesting `uf doctor` to check tool availability

#### Scenario: Not a git repository

- **GIVEN** `--dir` points to a directory that is not a
  git repository
- **WHEN** the user runs `uf gate --phase pr`
- **THEN** the `not-on-main` check fails with a
  descriptive message (not a raw exec error)

#### Scenario: Git invocation times out

- **GIVEN** `git` is available but the branch-detection
  invocation does not respond within the bounded git
  command timeout
- **WHEN** the user runs `uf gate --phase pr`
- **THEN** the `not-on-main` check fails with the
  bounded-timeout message naming the timeout bound

#### Scenario: Detached HEAD state

- **GIVEN** the git repository is in detached HEAD state
  and no CI-provided ref (`GITHUB_HEAD_REF`,
  `GITHUB_REF_NAME`) recovers the branch
- **WHEN** the user runs `uf gate --phase pr`
- **THEN** the `not-on-main` check passes (the literal
  `HEAD` is not `main`) and the report's `branch` field
  records `HEAD`

#### Scenario: Detached HEAD with recovered main ref

- **GIVEN** the git repository is in detached HEAD state
  and the CI-provided ref recovers `main` (a push event
  to `main`, or a pull request whose head branch is
  `main`)
- **WHEN** the user runs `uf gate --phase pr`
- **THEN** the `not-on-main` check fails and the
  report's `branch` field records `main`

Previously: GATE-FR-008 required the not-on-main check
itself to execute `git rev-parse --abbrev-ref HEAD` using
`exec.Command` with explicit argument separation, and
documented that a detached HEAD passes unconditionally
because it is not `main`. The check's own subprocess made
not-on-main a second source of truth for the current branch,
diverging from the run's resolution: on a detached CI
checkout whose recovered ref was `main`, the report recorded
`main` while the check evaluated the literal `HEAD` and
passed. This delta binds the check to the shared resolution
(GATE-FR-012), qualifies the detached-HEAD pass to checkouts
with no recoverable CI ref, mandates the report's `branch`
field record the evaluated branch, and adds the recovered
`main` and git-timeout scenarios (issue #938; PR #582 round-4
architect advisory).

## REMOVED Requirements

None.
