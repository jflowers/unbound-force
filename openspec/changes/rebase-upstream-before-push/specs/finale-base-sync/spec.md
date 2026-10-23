## ADDED Requirements

### Requirement: uf_finale_base_state tool

The `uf-finale` plugin MUST provide an `uf_finale_base_state`
tool that reports how far the current HEAD is ahead of and
behind the PR base branch on the target remote. The tool MUST
return a success envelope containing at minimum
`{remote, baseBranch, baseRef, aheadBy, behindBy}` with integer
counts. The tool MUST NOT modify the working tree (read-only
apart from the fetch) and MUST accept an injectable `GitExec`
and cwd for testability.

#### Scenario: Fork with upstream remote configured

- **GIVEN** the repository has remotes `origin` and `upstream`
- **AND** `refs/remotes/upstream/HEAD` resolves to
  `refs/remotes/upstream/main`
- **WHEN** `uf_finale_base_state` is called
- **THEN** the target remote is `upstream` (preferred when
  present, else `origin`)
- **AND** the base branch is resolved via
  `git symbolic-ref refs/remotes/upstream/HEAD`
- **AND** the tool fetches `upstream main`
- **AND** returns `{remote: "upstream", baseBranch: "main",
  baseRef: "upstream/main", aheadBy: <n>, behindBy: <m>}`
  where `aheadBy` counts `<remote>/<baseBranch>..HEAD` and
  `behindBy` counts `HEAD..<remote>/<baseBranch>` via
  `git rev-list`

#### Scenario: Non-fork repository

- **GIVEN** the repository has only an `origin` remote
- **AND** HEAD is 3 commits ahead of and 0 commits behind
  `origin/main`
- **WHEN** `uf_finale_base_state` is called
- **THEN** the tool fetches `origin main`
- **AND** returns `{remote: "origin", baseBranch: "main",
  baseRef: "origin/main", aheadBy: 3, behindBy: 0}`

#### Scenario: Remote HEAD symbolic ref unset

- **GIVEN** the repository has an `origin` remote
- **AND** `git symbolic-ref refs/remotes/origin/HEAD` fails
- **WHEN** `uf_finale_base_state` is called
- **THEN** the tool falls back to base branch `main`
- **AND** returns `baseBranch: "main"` with counts against
  `origin/main`

#### Scenario: Fetch fails offline

- **GIVEN** the target remote is unreachable
- **WHEN** `uf_finale_base_state` is called
- **THEN** the tool returns a failure envelope with
  `retryable: true` and code `BASE_SYNC_FETCH`, including the
  resolved remote and base branch in the message
- **AND** the command treats this as a soft gate: it warns
  that base freshness is unknown and proceeds to the push step

#### Scenario: Branch behind the base

- **GIVEN** HEAD is 2 commits ahead of and 7 commits behind
  `origin/main`
- **WHEN** `uf_finale_base_state` is called
- **THEN** the tool returns `{aheadBy: 2, behindBy: 7}`
- **AND** the working tree is unmodified

### Requirement: Base sync gate before push

The `/uf.finale` command MUST include a "Sync with Base Branch"
step between the commit step and the push step. The step MUST
call `uf_finale_base_state` and branch on `behindBy`. The gate
MUST include a session-resume guard and MUST NOT rebase without
explicit user confirmation.

#### Scenario: Branch up to date

- **GIVEN** `uf_finale_base_state` returns `behindBy: 0`
- **WHEN** the sync step runs
- **THEN** the command proceeds to the push step without
  presenting a gate

#### Scenario: User confirms rebase

- **GIVEN** `uf_finale_base_state` returns
  `{baseRef: "origin/main", behindBy: 7}`
- **WHEN** the gate presents
  `["Rebase onto origin/main (recommended)",
  "Continue without rebase -- PR will be behind",
  "Abort -- keep commits local"]`
- **AND** the user selects the rebase option
- **THEN** the command calls `git_rebase` with ref
  `origin/main`
- **AND** on success, checkpoints `step: "sync-base"` with the
  outcome (`behindBy` and whether a rebase was performed)
- **AND** proceeds to the push step with the rebase recorded

#### Scenario: Rebase conflicts

- **GIVEN** the user confirmed a rebase onto `origin/main`
- **WHEN** `git_rebase` reports conflicts
- **THEN** the command calls `git_rebase_abort`
- **AND** reports which files conflicted
- **AND** stops, preserving the pre-rebase branch state

#### Scenario: User continues without rebase

- **GIVEN** `uf_finale_base_state` returns `behindBy` greater
  than 0
- **AND** the user selects "Continue without rebase"
- **WHEN** the finale proceeds
- **THEN** the PR is created with a warning that the branch is
  behind the base by the reported count

#### Scenario: Unpushed-commit finale passes through sync

- **GIVEN** step 2 finds no working-tree changes but
  unpushed commits exist
- **WHEN** the skip path runs
- **THEN** it lands on the sync step and flows through it to
  the push step, so an unpushed-commit finale receives the
  same base-sync check as a fresh commit

### Requirement: Push mode after rebase

After a successful base rebase in the sync step, the push step
MUST select the push mode from the branch's upstream state. The
command MUST NOT use `git push --force`; force-with-lease is
the only permitted history-rewriting push.

#### Scenario: First push after rebase

- **GIVEN** a successful rebase in the sync step
- **AND** the branch has never been pushed
- **WHEN** the push step runs
- **THEN** the command calls `git_push` with
  `{setUpstream: true, branch}`

#### Scenario: Already-pushed branch after rebase

- **GIVEN** a successful rebase in the sync step
- **AND** the branch has an existing upstream
- **WHEN** the push step runs
- **THEN** the command calls `git_push_force_with_lease`
  because the rebase rewrote history

### Requirement: Nine-step finale sequence

The `/uf.finale` command MUST run nine numbered steps in
order: 1 Branch Safety Gate, 2 Check for Changes, 3 Commit
Message, 4 Sync with Base Branch, 5 Push, 6 Create or Find PR,
7 Watch CI Checks (with 7b Conflict Recovery), 8 Return to
Main, 9 Summary. All in-file cross-references to step numbers
MUST be consistent with this sequence.

Previously the command had eight steps with Push at 4 and the
step-2 no-changes path skipping directly to Push.

#### Scenario: Sync step inserted between commit and push

- **GIVEN** the updated `/uf.finale` command file
- **WHEN** the step sequence is read
- **THEN** the steps appear in the nine-step order above
- **AND** the step-2 no-changes path skips to step 4 (Sync
  with Base Branch) and flows to step 5 (Push)
- **AND** every in-file cross-reference names the renumbered
  step ("proceed to 6b" becomes "proceed to 7b"; the POST-CI
  momentum references shift by one)

### Requirement: Push gate with rebase context

The push gate MUST offer "Push to remote" and "Abort -- keep
commits local", warn when `uf_finale_push_state` reports
`diverged` (branch versus its own tracking upstream), and
honor the sync-step outcome: when a base rebase occurred and
the branch has an upstream, "Push to remote" MUST use
`git_push_force_with_lease` with gate copy stating why (the
rebase rewrote history).

#### Scenario: Push after step-4 rebase with existing upstream

- **GIVEN** a successful rebase occurred in step 4
- **AND** `uf_finale_push_state` reports `upstreamExists: true`
- **WHEN** the push gate presents and the user selects
  "Push to remote"
- **THEN** the command calls `git_push_force_with_lease`
- **AND** the gate copy explained that the rebase rewrote
  history

#### Scenario: Push without any rebase

- **GIVEN** no rebase occurred in step 4
- **WHEN** the push gate presents and the user selects
  "Push to remote"
- **THEN** the command calls `git_push` exactly as before

## REMOVED Requirements

None.
