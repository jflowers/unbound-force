## Why

Unbound Force scaffolded repos have no command to resolve
merge conflicts on an already-open PR. The capability exists
only as a personal global command
(`~/.config/opencode/commands/resolve-branch-conflict.md`),
verified in daily use on one machine; every repo scaffolded by
`uf init` lacks it.

`/uf.finale` step 4 ("Sync with Base Branch", change
`rebase-upstream-before-push`) syncs the *current* feature
branch before creating the PR that finale itself will own. It
does not operate on an arbitrary already-open PR, does not
take a PR number, is not fork-aware by PR metadata, and
aborts on rebase conflicts rather than resolving them. When a
PR reports conflicts after other work merges to its base
branch, the user must rebase, resolve, and force-push by
hand.

The source command closes that gap end to end: it takes a PR
number, validates it, fetches PR metadata via `gh`, checks
out the head branch, resolves base/head remotes (fork-aware),
rebases onto the base, resolves conflicts while preserving
the PR author's intent, force-pushes with lease, verifies
mergeability, and never merges or approves.

Originating issue: #851.

## What Changes

Port the verified command into the UF command set as
`/uf.rebase-pr <PR_NUMBER>`:

- New command `.opencode/commands/uf.rebase-pr.md` — a full
  port of the verified source (staged for this change at
  `.local-sources/resolve-branch-conflict.md`; scratch input,
  git-excluded, never a deliverable) following
  `uf.review-pr.md` conventions: frontmatter description,
  `<protect>` block, session-resume guard, argument
  validation before any tool call, phased execution, and a
  guardrails section.
- Prefer the existing git plugin tools (`git_fetch`,
  `git_rebase`, `git_rebase_abort`,
  `git_push_force_with_lease`) over raw bash git invocations
  where available (determinism pack DE-001).
- Scaffold mirror
  `internal/scaffold/assets/opencode/commands/uf.rebase-pr.md`
  (tool-owned asset) plus the `expectedAssetPaths` update in
  `internal/scaffold/scaffold_test.go`, so `uf init` deploys
  the command and drift tests stay green.
- Documentation: `AGENTS.md` PR Review Commands table row
  and Project Structure command-count bump (32 → 33),
  `docs/usage.md` Quick Reference row,
  `docs/architecture.md` Review Commands table row, and a
  `CHANGELOG.md` Unreleased → Added entry. The
  documentation-gate issues (in-repo docs issue with
  per-surface dispositions plus tutorial/blog judgments,
  and the `unbound-force/website` sync issue) are filed
  before PR merge per task 4.4.
- `make check` green (lint, tests, build, coverage gates,
  plugin tests).

Command behavior (from the verified source):

1. PR number required, validated `^[1-9][0-9]*$` before any
   tool call; invalid → STOP.
2. Prerequisites: `which gh`, `gh auth status`; repo detected
   via `gh repo view` — never hardcoded.
3. Fetch PR fields (state, refs, mergeability, base/head
   repos); STOP if CLOSED/MERGED or already conflict-free
   (`MERGEABLE` + `CLEAN`).
4. Checkout via `gh pr checkout` with a fetch-from-head-repo
   fallback when checkout fails.
5. Resolve `BASE_REMOTE`/`HEAD_REMOTE` by matching
   `git remote -v` URLs against the PR's base/head repos —
   never assume `origin` is the base.
6. `git fetch <BASE_REMOTE>` then
   `git rebase <BASE_REMOTE>/<BASE_BRANCH>`.
7. Resolve flagged files only, preserving the PR author's
   intent; no guessing — STOP and offer `git rebase --abort`
   on ambiguity.
8. `git push --force-with-lease <HEAD_REMOTE> <HEAD_BRANCH>`
   only; never push to base or protected branches.
9. Re-check `mergeable`/`mergeStateStatus`; report. Never
   merge, approve, or close the PR.

## Capabilities

### New Capabilities
- `uf-rebase-pr`: Rebase a conflicted PR's head branch onto
  its base branch and force-push with lease so the PR can be
  merged with a rebase once approved. Fork-aware remote
  resolution, author-intent-preserving conflict resolution,
  and strict no-merge/no-approve guardrails.

### Modified Capabilities
- None. `/uf.finale` step 4 (`finale-base-sync`) is
  unchanged; this command is complementary, not a
  modification.

### Removed Capabilities
- None.

## Impact

- **Files**:
  - `.opencode/commands/uf.rebase-pr.md` — new command.
  - `internal/scaffold/assets/opencode/commands/uf.rebase-pr.md`
    — identical mirror (tool-owned asset).
  - `internal/scaffold/scaffold_test.go` —
    `expectedAssetPaths` gains the new asset (comment count
    11 → 12).
  - `AGENTS.md` — PR Review Commands table row; Project
    Structure command-count bump (32 → 33 files).
  - `docs/usage.md` — Quick Reference row.
  - `docs/architecture.md` — Review Commands table row.
  - `CHANGELOG.md` — `port-uf-rebase-pr:` entry under
    Unreleased → Added with Spec and Docs issue references.
- **Behavioral**: users gain `/uf.rebase-pr <N>` in every
  scaffolded repo after a `uf init` refresh. No existing
  command's behavior changes.
- **Cross-repo**: scaffolded repos receive the command via
  `uf init`; no repo-specific changes required.
- **Documentation gate**: task 4.4 files the in-repo docs
  issue (per-surface dispositions for `CHANGELOG.md`,
  `AGENTS.md`, `docs/usage.md`, `docs/architecture.md`,
  `README.md`, plus tutorial and blog judgments) and the
  `unbound-force/website` sync issue before the PR merges;
  both issue numbers are recorded here and in the
  CHANGELOG entry. Filed:
  unbound-force/unbound-force#856 (dispositions; tutorial
  #855), unbound-force/website#340 (website sync).
- **Coordination**: distinct from `/uf.finale` step 4, which
  syncs the current branch before creating its own PR and
  aborts on conflict. This command operates on any open PR by
  number, resolves conflicts, and pushes to the head remote
  only.

## Constitution Alignment

Assessed against the Unbound Force org constitution v1.4.0.

### I. Autonomous Collaboration

**Assessment**: PASS

The command is a self-contained instruction artifact in the
repository. It consumes well-defined machine-parseable
artifacts (`gh pr view --json` fields) rather than parsing
free-form output, and it introduces no runtime coupling
between heroes. It complements `/uf.finale` without modifying
it, so each command remains independently invocable.

### II. Composability First

**Assessment**: PASS

The command requires only the `gh` CLI and git —
prerequisites already shared by `/uf.review-pr` and
`/uf.address-feedback`. No other hero is required. Scaffolded
repos gain the capability through `uf init` with no
configuration, and repos without the command lose nothing
(the capability is additive).

### III. Observable Quality

**Assessment**: PASS

Every decision point reads machine-parseable state (`gh pr
view --json number,title,state,headRefName,baseRefName,
mergeable,mergeStateStatus,baseRepository,headRepository`),
records the resolved values (`PR_NUMBER`, `HEAD_BRANCH`,
`BASE_BRANCH`, `BASE_REPO`, `HEAD_REPO`, `BASE_REMOTE`,
`HEAD_REMOTE`), and reports the final mergeability verdict
with the exact fields checked. The deterministic guardrail
("the same PR rebased onto the same base MUST produce the
same result") makes outcomes reproducible.

### IV. Testability

**Assessment**: PASS

The ported command is a declarative instruction file with no
compiled code, so testability is enforced at the seams the
repo already tests: the scaffold mirror must match the
canonical command byte-for-byte (`TestEmbeddedAssets_
MatchSource`), the asset must appear in `expectedAssetPaths`
(`TestAssetPaths_MatchExpected`), and `make check` /
scaffold drift tests gate the change. Conflict-resolution
steps instruct verification via `git status` unmerged paths,
which is a directly observable side effect.

### V. Security by Default

**Assessment**: PASS

Repository identifiers are dynamically detected (`gh repo
view`), never hardcoded. The push is bounded to the head
remote and head branch only, with `--force-with-lease` (never
`--force`) so a concurrent push cannot be silently
overwritten. No secrets are handled and no new dependencies
are introduced. Ambiguous conflict resolutions fail closed
(STOP + offer abort) rather than guessing.

### VI. Deterministic Execution

**Assessment**: PASS

Argument validation, remote resolution, fetch, rebase, and
push are prescribed as exact commands with exact
preconditions, and the scope directs implementers to prefer
the existing deterministic git plugin tools (`git_fetch`,
`git_rebase`, `git_rebase_abort`,
`git_push_force_with_lease`) over paraphrased bash wherever
available (determinism pack DE-001). Judgment is confined to
conflict resolution, where the command stops instead of
fabricating a resolution.
