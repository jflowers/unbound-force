## Why

When CI goes red on an open PR, no Unbound Force command carries
the fix through end to end:

- `/uf.finale` step 7 detects failing checks after PR creation
  but only offers "Investigate the failure" — the offer does not
  diagnose, fix, push, or re-verify.
- `/uf.address-feedback` fixes reviewer *feedback* (review
  threads), not red checks.
- `/uf.rebase-pr` (issue #851, not yet implemented) rebases a
  conflicted PR but does not address failing checks.

The result is a manual gap: the human reads failure logs,
classifies the cause, rebases, fixes, pushes, and re-polls CI by
hand. A red PR is the most common post-PR state requiring agent
assistance, and the swarm currently has no artifact-driven path
from red to green.

This change adds `/uf.fix-ci [PR_NUMBER]`: it diagnoses failing
CI checks on an open PR, runs a gated fix loop
(diagnose → fix → commit → push → re-poll), rebases the head
branch onto base when the PR is conflicted or behind, and
verifies CI ends green — with a human gate before any fix
executes and an absolute never-merge rule.

`originating_issue: 858` is set in `.openspec.yaml`.

## What Changes

- New command `.opencode/commands/uf.fix-ci.md`, invoked as
  `/uf.fix-ci [PR_NUMBER]`, following `uf.review-pr.md`
  conventions: YAML frontmatter with `$ARGUMENTS` description,
  `<protect>` block, session-resume guard, progress checkpoints,
  TodoWrite tracking, MANDATORY GATE question-tool blocks, and a
  terminal Guardrails section.
- The command's behavior (from issue #858):
  1. **Arguments**: PR number optional; omitted → auto-detect the
     open PR for the current branch. Invalid → STOP.
  2. **Prerequisites**: `which gh`, `gh auth status` (same
     pattern as `uf.review-pr` step 0).
  3. **Fetch PR state**: `gh pr view <N> --json number,state,
     headRefName,baseRefName,mergeable,mergeStateStatus,
     headRepository,baseRepository` plus `gh pr checks <N>`.
     STOP if CLOSED/MERGED or all checks pass.
  4. **Diagnose**: for each failed check, fetch failure logs
     (`gh run view <run-id> --log-failed`); classify root cause:
     code failure (build/test/lint), stale branch (base moved),
     conflict, or flaky/infra.
  5. **Rebase when conflicted or behind**: `git_fetch
     <BASE_REMOTE>` → `git_rebase <BASE_REMOTE>/<BASE_BRANCH>`;
     resolve flagged files preserving author intent; on
     ambiguity STOP and offer `git_rebase_abort`. MUST NEVER
     merge base into head — rebase only. This rule is absolute.
  6. **Gated fix loop**: present diagnosis + proposed fix plan;
     human confirms via question tool. Then fix → conventional
     commit → push (`git_push`, or `git_push_force_with_lease`
     after a rebase since history was rewritten) → re-poll CI.
     Iteration cap of 3; STOP on cap or unfixable failure.
  7. **Flaky/infra path**: when logs indicate flakiness or infra
     failure, offer `gh run rerun --failed` instead of a code
     change.
  8. **Final verification**: `uf_finale_ci_poll` until green or
     timeout; report final status. MUST NOT merge, approve, or
     close the PR.
- Fix commits MUST pass `/uf.review-council` before push
  (the `uf.address-feedback` §4.3 precedent), once per iteration
  after all fixes for that iteration are committed.
- Plugin tools are preferred over raw bash wherever one exists:
  `uf_finale_ci_poll`, `git_fetch`, `git_rebase`,
  `git_rebase_abort`, `git_push`, `git_push_force_with_lease`,
  `git_conflict_files`, `scan_conflict_markers`.
- Scaffold mirror `internal/scaffold/assets/opencode/commands/
  uf.fix-ci.md` (byte-identical, drift tests stay green), plus
  the `expectedAssetPaths` manifest entry and asset-count
  comment update in `internal/scaffold/scaffold_test.go`.
- `AGENTS.md` PR Review Commands table gains
  `/uf.fix-ci [N]` — Post-PR — diagnose + fix failing checks.
- `docs/usage.md` gains a `/uf.fix-ci` section and Quick
  Reference row.
- `docs/architecture.md` Review Commands table gains a
  `/uf.fix-ci [N]` row.

The command complements `/uf.rebase-pr` (#851): it shares that
issue's rebase conventions (fork-aware remote resolution,
force-with-lease after history rewrite, never touch protected
branches) but stays self-contained — it neither depends on nor
modifies `uf.rebase-pr`.

## Capabilities

### New Capabilities
- `fix-ci`: Diagnose failing CI checks on an open PR and carry
  a gated, human-confirmed repair through diagnosis, rebase
  (never merge), fix, review-council, push, and final
  green verification.

### Modified Capabilities
- None. The baseline specs (`ci`, `graphthulhu-distribution`,
  `review-council`) are untouched. The new command's
  question-tool gates follow the shared question-tool
  presentation contract by construction (visibility directive,
  per-option reasoning, advisory recommendation,
  recommended-first ordering, fail-closed full option set); the
  contract's gate-inventory requirement lives in the pending
  `question-tool-presentation-contract` change and is not
  re-anchored here.

### Removed Capabilities
- None.

## Impact

- **Files added**:
  - `.opencode/commands/uf.fix-ci.md` (canonical command)
  - `internal/scaffold/assets/opencode/commands/uf.fix-ci.md`
    (byte-identical mirror)
- **Files modified**:
  - `internal/scaffold/scaffold_test.go`
    (`expectedAssetPaths` + command-count comment)
  - `AGENTS.md` (PR Review Commands table)
  - `docs/usage.md` (command section + Quick Reference row)
  - `docs/architecture.md` (Review Commands table row)
- **Behavior**: No existing command changes behavior. `/uf.finale`
  step 7's failure branch remains as-is; `/uf.fix-ci` is a
  separate post-PR entry point the human invokes.
- **Verification**: `make check` (lint, test, build, coverage
  gates, plugin tests) must stay green; scaffold drift and
  asset-manifest tests must pass with the new mirror.
- **Documentation gate**: user-facing command addition — the
  stacked documentation gates apply: a documentation issue
  must be filed against this repo (AGENTS.md gate) and a
  tracking issue in the `unbound-force/website` repository
  (org constitution Cross-Repo Documentation rule), both
  before PR merge.
- **Security**: The command reads PR state and failure logs,
  writes commits, and pushes to the PR branch. All mutations
  (rebase, fix commits, push, rerun) sit behind human
  question-tool gates; untrusted log/PR text is never
  interpolated into shell arguments.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

The command is a self-contained slash command whose inputs and
outputs are well-defined artifacts: gh JSON state, failure-log
evidence, diagnosis classification, and final CI status. It does
not couple to another hero at runtime; it consumes existing
plugin tools (`uf_finale_ci_poll`, git tools) through their
documented contracts. Its final report is self-describing
(check names, classifications, actions taken, final status).

### II. Composability First

**Assessment**: PASS

`/uf.fix-ci` is independently invocable and delivers its core
value alone. It requires only `gh` plus the plugin tools already
shipped with the meta package — no other command, hero, or
workflow must be present. It composes additively with
`/uf.finale` (which surfaces the failure) and
`/uf.review-council` (which gates fix commits) without modifying
either, and stays self-contained relative to the pending
`/uf.rebase-pr` (#851).

### III. Observable Quality

**Assessment**: PASS

Every decision is grounded in machine-parseable evidence:
`gh pr view --json`, `gh pr checks --json`, and
`gh run view --log-failed`. The diagnosis (per-check root-cause
classification), fix plan, iteration count, and final CI
verdict are reported to the human with provenance (PR number,
run ids, check names). The command never asserts a fix worked
without `uf_finale_ci_poll` evidence.

### IV. Testability

**Assessment**: PASS

The command is a markdown-defined workflow whose deterministic
guarantees are pinned by existing Go contract tests: scaffold
drift detection (byte-identical mirror), the asset manifest
test, and the structural command-contract tests. Tasks require
extending those pins to the new command so regressions
(missing gates, never-merge wording, drift) fail the build.

### V. Security by Default

**Assessment**: PASS

All mutating operations (rebase, commit, push, `gh run rerun`)
sit behind MANDATORY GATE human confirmation. Untrusted text
(PR titles, failure-log content) is never interpolated into
shell arguments. The command pushes only to the PR's own head
branch, never touches protected base branches, and cannot
merge, approve, or close the PR. No new dependencies are added.

### VI. Deterministic Execution

**Assessment**: PASS

Mechanical steps (PR-state fetch, check polling, log fetch,
rebase, push) execute through existing tools (`uf_finale_ci_poll`,
`git_fetch`, `git_rebase`, `git_push`, `git_push_force_with_lease`)
rather than re-reasoned bash prose; only judgment (root-cause
classification, fix authoring, option recommendation) remains
in instruction prose. The command reuses the tested
`uf_finale_ci_poll` for CI polling instead of inventing a
bash watch loop.
