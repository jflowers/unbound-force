## ADDED Requirements

### Requirement: FR-001 Argument resolution and prerequisites

`/uf.fix-ci` MUST accept an optional PR number argument. When
the argument is omitted, the command MUST auto-detect the open
PR for the current branch. An invalid or unresolvable PR number
MUST STOP before any state is read or mutated. Before any
other step, the command MUST verify the `gh` CLI is installed
and authenticated, stopping with a remediation message when
either check fails.

#### Scenario: Explicit PR number

- **GIVEN** the user invoked `/uf.fix-ci 42`
- **WHEN** the command parses arguments
- **THEN** it uses PR 42 for every subsequent step without
  running any branch or PR auto-detection

#### Scenario: Auto-detection when omitted

- **GIVEN** the user invoked `/uf.fix-ci` with no argument
- **AND** an open PR exists for the current branch
- **WHEN** the command resolves the PR
- **THEN** it uses the auto-detected PR for every subsequent
  step

#### Scenario: No open PR stops the command

- **GIVEN** the user invoked `/uf.fix-ci` with no argument
- **AND** no open PR exists for the current branch
- **WHEN** the command resolves the PR
- **THEN** it STOPs with an error instructing the user to
  provide a PR number

#### Scenario: Missing gh authentication stops the command

- **GIVEN** the `gh` CLI is not installed or not authenticated
- **WHEN** the command runs its prerequisite checks
- **THEN** it STOPs with the remediation message before
  fetching any PR state

### Requirement: FR-002 PR state fetch and eligibility

The command MUST fetch PR state via `gh pr view <N> --json
number,state,headRefName,baseRefName,mergeable,mergeStateStatus,
headRepository,isCrossRepository,url` (the base repository
derives from the PR `url`; `gh pr view --json` exposes no
`baseRepository` field) and check status via the pinned
invocation `gh pr checks <N> --json name,state,bucket,link` —
the `bucket` field (`pass`, `fail`, `pending`, `skipping`,
`cancel`) categorizes each check for the eligibility gate,
with `state` and `link` recorded alongside. It MUST STOP when
the PR is CLOSED or MERGED, and MUST STOP with a green report
when all checks already pass.

#### Scenario: Closed or merged PR stops the command

- **GIVEN** PR 42 has state `CLOSED` or `MERGED`
- **WHEN** the command fetches PR state
- **THEN** it STOPs with an error naming the terminal state
- **AND** performs no diagnosis, rebase, fix, or push

#### Scenario: All checks passing stops the command

- **GIVEN** PR 42 is open and every check passes
- **WHEN** the command fetches check status
- **THEN** it reports the PR green and STOPs without entering
  the fix loop

#### Scenario: Failing checks proceed to diagnosis

- **GIVEN** PR 42 is open with at least one failing check
- **WHEN** the command fetches PR state and check status
- **THEN** it records the PR's head and base refs, mergeable
  state, fork orientation, and the failing check list
- **AND** proceeds to diagnosis

#### Scenario: Local head-branch mismatch stops the command

- **GIVEN** PR 42's head branch is `feature-x`
- **AND** the current local branch is not `feature-x`
- **WHEN** the command verifies the local checkout
- **THEN** it STOPs with checkout guidance instead of
  switching branches
- **AND** a dirty working tree is a STOP with stash guidance
  before any rebase

### Requirement: FR-003 Failure diagnosis with log evidence

For each failed check, the command MUST fetch failure logs via
`gh run view <run-id> --log-failed` and classify the root cause
as exactly one of: code failure (build/test/lint), stale branch
(base moved), conflict, or flaky/infra. Classification MUST be
grounded in the fetched log evidence, not assumed.

#### Scenario: Code failure classification

- **GIVEN** check `test` failed on PR 42
- **AND** its failure log shows a compile or assertion error
  introduced by the PR's changes
- **WHEN** the command diagnoses the failure
- **THEN** the check is classified as a code failure
- **AND** enters the fix loop path

#### Scenario: Stale branch classification

- **GIVEN** check `test` failed on PR 42
- **AND** its failure log shows errors that the base branch's
  newer commits explain, or the PR is reported behind or
  conflicted against its base
- **WHEN** the command diagnoses the failure
- **THEN** the check is classified as a stale branch
- **AND** the rebase path is selected before any code fix

#### Scenario: Flaky or infra classification

- **GIVEN** check `test` failed on PR 42
- **AND** its failure log shows a runner, network, or known
  flaky-test failure rather than a code error
- **WHEN** the command diagnoses the failure
- **THEN** the check is classified as flaky/infra
- **AND** the rerun path is offered instead of a code change

### Requirement: FR-004 Rebase-only branch synchronization

When the PR is conflicted or behind its base, the command MUST
synchronize by rebasing the head branch onto base: `git_fetch
<BASE_REMOTE>` then `git_rebase <BASE_REMOTE>/<BASE_BRANCH>`.
The rebase MUST NOT run before the human confirms the
diagnosis and plan via the question-tool gate (FR-005,
FR-013). It MUST NEVER merge the base branch into the head
branch; this rule is absolute. After a successful rebase,
pushes MUST use `git_push_force_with_lease` because history
was rewritten.

#### Scenario: Human gate precedes the rebase

- **GIVEN** PR 42 is conflicted or behind its base
- **WHEN** the command prepares to synchronize
- **THEN** it presents the diagnosis and proposed
  synchronization plan via the question tool
- **AND** no `git_fetch` or `git_rebase` executes before the
  human confirms

#### Scenario: Rebase onto base

- **GIVEN** PR 42 is behind its base branch
- **WHEN** the command synchronizes the branch
- **THEN** it fetches the base remote and rebases the head
  branch onto `<BASE_REMOTE>/<BASE_BRANCH>`
- **AND** does not run any merge of base into head

#### Scenario: Clean rebase then force-with-lease push

- **GIVEN** the rebase completes without conflicts
- **WHEN** the command pushes the rebased branch
- **THEN** it uses `git_push_force_with_lease`, not a plain
  push

#### Scenario: Conflict resolution preserves author intent

- **GIVEN** the rebase reports conflicted files
- **WHEN** the command resolves them
- **THEN** it resolves by integrating both sides preserving the
  PR author's intent, not by choosing one side
- **AND** re-scans for conflict markers before continuing

#### Scenario: Ambiguous conflict stops with abort offer

- **GIVEN** a conflict the command cannot resolve with
  confidence
- **WHEN** ambiguity is detected
- **THEN** it STOPs and offers `git_rebase_abort` so the
  pre-rebase branch state is preserved

### Requirement: FR-005 Gated fix loop with human confirmation

Before any fix executes — and before the rebase that may
precede fixes (FR-004) — the command MUST present the full
diagnosis and proposed plan and obtain human confirmation via
the question tool. Each iteration MUST follow fix →
conventional commit (`type: description`) → the FR-006
review-council gate → push → re-poll CI. The loop MUST stop
after 3 iterations or on an unfixable failure, reporting what
remains red.

#### Scenario: Human gate before any mutation

- **GIVEN** diagnosis classified one or more checks as code
  failures
- **WHEN** the command prepares to fix (or to rebase first,
  per FR-004)
- **THEN** it prints the diagnosis and proposed plan
- **AND** presents a question tool gate whose options include
  proceeding with the plan and declining it
- **AND** no rebase, fix, commit, or push executes before the
  human chooses

#### Scenario: Push mode follows rebase state

- **GIVEN** fixes are committed for the current iteration
- **WHEN** the command pushes
- **THEN** it uses `git_push` when no rebase occurred this
  invocation
- **AND** uses `git_push_force_with_lease` when a rebase
  occurred, since history was rewritten

#### Scenario: Iteration cap stops the loop

- **GIVEN** checks still fail after 3 fix iterations
- **WHEN** the loop evaluates continuing
- **THEN** it STOPs and reports the persistent failures with
  their diagnoses instead of starting a fourth iteration

#### Scenario: Unfixable failure stops the loop

- **GIVEN** diagnosis identifies a failure the command cannot
  fix (missing secrets access, base branch itself broken,
  external dependency outage)
- **WHEN** the fix plan is formed
- **THEN** the command STOPs and reports the failure as
  unfixable with the evidence, rather than attempting a fix

### Requirement: FR-006 Review-council gate before push

Fix commits MUST pass `/uf.review-council` before push, run
once per iteration after all fixes for that iteration are
committed. If the council requests changes, the command MUST
fix findings and re-run the council before pushing; if the fix
loop exhausts its iterations, it MUST NOT push.

#### Scenario: Council pass enables push

- **GIVEN** all fixes for iteration 1 are committed
- **WHEN** `/uf.review-council` runs on the cumulative changes
- **AND** returns an approving verdict
- **THEN** the iteration proceeds to push

#### Scenario: Council failure blocks push

- **GIVEN** the council returns REQUEST CHANGES
- **WHEN** the command evaluates the verdict
- **THEN** it fixes the findings and re-runs the council
  before any push
- **AND** if iterations are exhausted, it STOPs without
  pushing

### Requirement: FR-007 Flaky and infra rerun path

When diagnosis classifies a failure as flaky or infra, the
command MUST offer `gh run rerun --failed` instead of a code
change, with the classification evidence shown, and MUST
re-poll CI after any rerun.

#### Scenario: Rerun offered instead of a code fix

- **GIVEN** check `integration` is classified flaky/infra
- **WHEN** the command presents the fix plan
- **THEN** the plan offers rerunning the failed run via
  `gh run rerun --failed`
- **AND** no code change is proposed for that check

#### Scenario: Re-poll after rerun

- **GIVEN** the human chose the rerun option
- **WHEN** the rerun is triggered
- **THEN** the command re-polls CI to observe the outcome

### Requirement: FR-008 Final verification and terminal constraints

After the fix loop and any rebase, the command MUST verify the
final CI state with `uf_finale_ci_poll` until checks are green
or the poll times out, and MUST report the final status. The
command MUST NOT merge the PR, approve the PR, or close the PR.

#### Scenario: Green verification

- **GIVEN** the fix loop completed and pushed fixes
- **WHEN** `uf_finale_ci_poll` runs
- **AND** reports all checks passing
- **THEN** the command reports the PR green with the actions
  taken and completes

#### Scenario: Timeout reports final status

- **GIVEN** `uf_finale_ci_poll` times out with checks still
  running or failing
- **WHEN** the poll returns
- **THEN** the command reports the last known status and the
  checks still not green

#### Scenario: No merge, approve, or close

- **GIVEN** any terminal state of the command
- **WHEN** the command completes
- **THEN** the PR remains open, unmerged, and unapproved by
  this command

### Requirement: FR-009 Command structure conventions

The command file MUST follow `uf.review-pr.md` conventions:
YAML frontmatter with an `$ARGUMENTS` description, a
`<protect>` block, a session-resume guard that re-reads the
template and recovers progress from `get_progress` before
acting, progress checkpoints after each phase, TodoWrite
tracking maintained alongside checkpoints, and a terminal
Guardrails section.

#### Scenario: Session-resume guard recovers progress

- **GIVEN** the session was resumed from compressed context
- **WHEN** the command re-executes
- **THEN** it re-reads the full template
- **AND** calls `get_progress` with `command: "uf.fix-ci"` to
  recover checkpoint state
- **AND** resumes from the first incomplete phase without
  inferring completion from compressed summaries

#### Scenario: Checkpoints and TodoWrite maintained together

- **GIVEN** the command completes a phase
- **WHEN** the phase finishes
- **THEN** it calls `checkpoint` with the phase's step name
- **AND** marks the corresponding TodoWrite item completed

### Requirement: FR-010 Plugin tool preference

The command MUST use existing plugin tools over raw bash
wherever one exists: `uf_finale_ci_poll` for CI polling,
`git_fetch`, `git_rebase`, `git_rebase_abort`,
`git_push`, `git_push_force_with_lease` for git operations,
and `git_conflict_files` plus `scan_conflict_markers` for
conflict detection. Raw bash is reserved for operations with
no plugin tool (`gh` commands, remote/branch/status
verification, staging, the conventional fix commit, rebase
continuation).

#### Scenario: CI polling through the plugin tool

- **GIVEN** the command needs the final CI state
- **WHEN** it polls
- **THEN** it calls `uf_finale_ci_poll` rather than a bash
  `gh pr checks --watch` loop

#### Scenario: Rebase through plugin tools

- **GIVEN** the PR is behind its base
- **WHEN** the command synchronizes
- **THEN** it uses `git_fetch` and `git_rebase`, not raw git
  commands

### Requirement: FR-011 Scaffold mirror and manifest sync

The canonical command `.opencode/commands/uf.fix-ci.md` MUST
have a byte-identical scaffold mirror at
`internal/scaffold/assets/opencode/commands/uf.fix-ci.md`, and
`expectedAssetPaths` in `internal/scaffold/scaffold_test.go`
MUST list the new asset with the command-count comment updated.
Drift and manifest tests MUST pass with the mirror in place.

#### Scenario: Drift detection stays green

- **GIVEN** both the canonical command and its scaffold mirror
  exist
- **WHEN** `go test ./internal/scaffold/...` runs
- **THEN** the drift test confirms the assets are byte-identical
- **AND** the manifest test confirms the new asset is listed

### Requirement: FR-012 Documentation updates

`AGENTS.md` MUST add `/uf.fix-ci [N]` to the PR Review
Commands table and bump its `commands/` structure count
comment. `docs/usage.md` MUST document the command with a
usage section and Quick Reference row. `docs/architecture.md`
MUST add it to its Review Commands table and Scaffolded Files
slash-commands list. `QUICKSTART.md` MUST bump its
scaffolded-commands count. `CHANGELOG.md` MUST carry an
Unreleased/Added entry with spec and documentation footers.

#### Scenario: AGENTS.md table row

- **GIVEN** the command ships
- **WHEN** a reader checks the PR Review Commands table
- **THEN** `/uf.fix-ci [N]` appears as a Post-PR command
  scoped to diagnosing and fixing failing checks

#### Scenario: usage documentation

- **GIVEN** the command ships
- **WHEN** a reader checks `docs/usage.md`
- **THEN** a `/uf.fix-ci` section explains the gated fix loop
  and never-merge rule
- **AND** the Quick Reference table contains the command

#### Scenario: architecture.md Review Commands table row

- **GIVEN** the command ships
- **WHEN** a reader checks the Review Commands table in
  `docs/architecture.md`
- **THEN** `/uf.fix-ci [N]` appears alongside the other
  Post-PR commands

#### Scenario: AGENTS.md structural count

- **GIVEN** the command ships
- **WHEN** a reader checks the project-structure tree in
  `AGENTS.md`
- **THEN** the `.opencode/commands/` count comment reflects
  the new command file

#### Scenario: architecture.md Scaffolded Files entry

- **GIVEN** the command ships
- **WHEN** a reader checks the Scaffolded Files
  slash-commands list in `docs/architecture.md`
- **THEN** `uf.fix-ci.md` appears among the scaffolded
  command files

#### Scenario: QUICKSTART scaffolded-commands count

- **GIVEN** the command ships
- **WHEN** a reader checks the "What Gets Scaffolded" list
  in `QUICKSTART.md`
- **THEN** the scaffolded commands count includes the new
  command

#### Scenario: CHANGELOG entry

- **GIVEN** the command ships
- **WHEN** a reader checks `CHANGELOG.md`
- **THEN** an Unreleased/Added entry names the command with
  its spec directory and documentation-issue footers

### Requirement: FR-013 Question-tool presentation contract

Every question-tool gate in the command MUST follow the shared
question-tool presentation contract: decision content printed
as plain session text above the question tool, the same
details and options in both, per-option reasoning, an advisory
recommendation with justification, the recommended option
first and labeled "(Recommended)", and the full option set
presented fail-closed.

#### Scenario: Presentation contract at every gate

- **GIVEN** the command presents any question-tool gate
- **WHEN** the gate renders
- **THEN** the decision content is printed as plain session
  text above the question tool with the same details and
  options
- **AND** the recommended option appears first and labeled
  "(Recommended)"

#### Scenario: Ungrounded recommendation still asks fail-closed

- **GIVEN** a gate whose diagnosis data does not ground any
  option
- **WHEN** the gate is presented
- **THEN** the gate says so, presents the trade-off, and still
  asks the full option set
