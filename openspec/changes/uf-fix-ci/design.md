## Context

Post-PR CI failures are detected but not repaired anywhere in
the command surface:

- `/uf.finale` step 7 offers "Investigate the failure" and
  stops there; nothing carries a fix through.
- `/uf.address-feedback` addresses review threads, not red
  checks.
- `/uf.rebase-pr` (issue #851) is not yet implemented and, per
  its issue, only rebases a conflicted PR.

This change adds `/uf.fix-ci [PR_NUMBER]` as a new
`.opencode/commands/uf.fix-ci.md` workflow command. It is
orchestration prose over existing tested tools: gh CLI for
state/logs, the git plugin tools for rebase/push, and
`uf_finale_ci_poll` for verification. No new Go business logic
and no new plugin tools are introduced. The constitution
alignment assessment lives in `proposal.md` (all six principles
PASS); the decisions below cite the principles they serve.

## Goals / Non-Goals

### Goals
- A single post-PR entry point that takes a red PR to verified
  green: diagnose → classify → (rebase | rerun | fix) →
  council → push → re-poll.
- Every mutation (rebase, commit, push, rerun) behind a human
  question-tool gate with the shared presentation contract.
- Rebase-only synchronization — never merge base into head.
- Root-cause classification grounded in fetched log evidence.
- Self-contained relative to `/uf.rebase-pr` (#851) and
  `/uf.finale`; no existing command changes behavior.
- Scaffolded and documented: byte-identical mirror, asset
  manifest entry, `AGENTS.md` table row, `docs/usage.md`
  section.

### Non-Goals
- Modifying `/uf.finale` step 7 (its failure branch remains
  the detector; `/uf.fix-ci` is the repair entry point).
- Implementing or depending on `/uf.rebase-pr` (#851).
- Fixing pre-existing base-branch failures (classified
  unfixable → STOP; `/uf.review-pr` step 7 already owns the
  fix-branch flow for those).
- Merging, approving, closing, or posting reviews on the PR.
- Dispatching review agents directly — the council gate
  invokes the existing `/uf.review-council` command.
- Auto-detecting or repairing CI configuration itself.

## Decisions

### D1: Markdown workflow command, not Go code

The command is agent instruction prose in
`.opencode/commands/uf.fix-ci.md`, following `uf.review-pr.md`
conventions (frontmatter, `<protect>`, session-resume guard,
MANDATORY GATE blocks, checkpoints, TodoWrite, Guardrails
section). Deterministic steps execute through existing plugin
tools; judgment (classification, fix authoring, option
recommendation) stays in prose.

One documented deviation applies, recorded here rather than
papered over: the PR-state, check-suite, and failure-log
fetches are mechanical steps for which no existing plugin
tool qualifies — `fetch_pr_review_context` returns
review-dispatch fields only (no `state`, `mergeable`,
`mergeStateStatus`, `headRepository`, or `baseRepository`)
and no tool wraps `gh pr checks` or `gh run view
--log-failed`. Extending the plugin layer is out of scope
for this change (scope discipline: one command, its mirror,
and docs), so those three fetch steps execute as command
prose — raw `gh` invocations with pinned JSON field lists
and the D9 untrusted-text hygiene — standing as an honest,
named deviation from the constitution VI ideal, not a silent
one. Issue #861 is the named extraction follow-up: extend
`fetch_pr_review_context` with the PR-repair fields and
route Phase 1's fetches through an intent-level tool.

Rationale: constitution VI (Deterministic Execution) — every
mechanical step that has a tool uses the tool, and the one
class that does not is documented above rather than claimed
as compliant; adding new Go code inside this change would
duplicate tested surface (e.g., CI polling already lives in
`uf_finale_ci_poll`).

### D2: Rebase-only synchronization; never merge

When the PR is conflicted or behind, the command runs
`git_fetch <BASE_REMOTE>` then `git_rebase
<BASE_REMOTE>/<BASE_BRANCH>` — only after the D6 human gate
confirms the diagnosis and plan; the rebase is a mutation
and never runs ungated. Merging base into head is
forbidden absolutely — no option offers it, and the Guardrails
section restates it. After a successful rebase, pushes use
`git_push_force_with_lease` because history was rewritten.
Rationale: linear history matches the org's rebase-merge flow
(`/uf.finale` suggests `gh pr merge --rebase`); the rule
mirrors the issue's absolute requirement and the rebase
conventions shared with #851 (fork-aware remote resolution,
force-with-lease, protected branches untouched).

### D3: Fork-aware remote resolution from the PR JSON

`gh pr view` returns `headRepository` and `baseRepository`.
The command resolves:

- `BASE_REMOTE`: the configured remote whose repository matches
  `baseRepository` — prefer `upstream`, fall back to `origin`.
  If no configured remote matches, STOP with guidance.
- `HEAD_REMOTE`: the configured remote matching
  `headRepository`. If absent (PR head is a fork the user
  cannot push to), STOP — the command cannot push someone
  else's branch.

This keeps the command correct for both same-repo and fork
PRs without calling `/uf.finale` tooling that assumes the
current branch's own PR.

### D4: Local head-branch verification

Fixing requires a local checkout. The command verifies the
current branch equals the PR's `headRefName`. On mismatch it
STOPs with checkout guidance rather than silently switching
branches (the pre-condition rule: never switch branches on a
dirty or unverified tree). The working tree MUST be clean
before any rebase; dirt is a STOP with stash guidance.

### D5: Four-class root-cause taxonomy drives path selection

Each failed check is classified from `gh run view <run-id>
--log-failed` evidence as exactly one of:

| Class | Evidence | Path |
|---|---|---|
| Code failure | compile/assertion/lint error in changed code | Fix loop |
| Stale branch | base moved; PR behind/conflicted | Rebase first |
| Conflict | mergeable/conflict state from PR JSON | Rebase first |
| Flaky/infra | runner, network, known-flaky signatures | Rerun offer |

Rationale: constitution III (Observable Quality) — the path
chosen is grounded in fetched evidence and the human gate
reviews the classification before anything executes. This
extends `/uf.review-pr` step 3a's PR-caused/pre-existing
causality determination into action selection.

### D6: Human gate before every mutation; resume-safe

The diagnosis gate presents the full diagnosis (per-check
class, evidence excerpt, and the proposed action for each —
rebase, fix, or rerun), then a question tool with
proceed/decline options. The gate fires after Phase 2's
classification table and before ANY mutation executes, the
Phase 3 rebase included: `git_fetch` and `git_rebase` do not
run until the human confirms the plan (FR-004, FR-013).
Session-resume guards
mirror `uf.address-feedback`: after compressed context, the
command re-reads the template, calls `get_progress` with
`command: "uf.fix-ci"`, and re-presents any gate whose
confirmation cannot be verified in the uncompressed history.
No mutation executes on inferred consent.

### D7: Review-council gate once per iteration (§4.3 precedent)

After all fixes in an iteration are committed, the command
runs `/uf.review-council` on the cumulative changes, exactly
as `uf.address-feedback` §4.3 does. REQUEST CHANGES enters the
fix loop; iteration exhaustion (no push) is a STOP. Rationale:
pushes are public mutations of the PR; the repo rule "MUST run
`/uf.review-council` before PR submission" applies to fix
commits as it does to feedback fixes.

### D8: Shared iteration budget, cap 3

One durable iteration counter per invocation covers both CI
fixes and council findings, recorded in checkpoint data
(`{"iteration": N}`). Three is the cap, matching `/uf.unleash`
step 6's review-loop budget. On exhaustion or an unfixable
classification, STOP with the remaining red checks and their
diagnoses.

### D9: Untrusted-text hygiene

PR titles, bodies, and failure-log text are untrusted data.
Log output is consumed read-only for classification; large
logs are saved to a temp file and navigated with targeted
reads (the `uf.review-pr` large-diff pattern). No untrusted
text is interpolated into shell arguments; any `gh api` call
with composed bodies writes the payload to a temp file and
uses `--input`.

### D10: Scaffold mirror and manifest

Ship `.opencode/commands/uf.fix-ci.md` canonical plus a
byte-identical `internal/scaffold/assets/opencode/commands/
uf.fix-ci.md`, and add the asset to `expectedAssetPaths`
(updating the "OpenCode commands (11)" count comment to 12)
in `internal/scaffold/scaffold_test.go`. The generic
`TestEmbeddedAssets_MatchSource` drift test and
`TestAssetPaths_MatchExpected` manifest test then cover the
new command. A structural pin test
(`TestCommandContracts_FixCiCommandStructure`, task 2.3) IS
added to `internal/scaffold/command_contract_test.go`,
asserting the command's structural invariants on both copies.
Only the dispatch-specific `TestCommandContracts_*` members
(`_RejectStaleDivisorDispatchLanguage`,
`_RejectStaleManualFinalizationLanguage`,
`_IncompatibleGhSlurpFlag`) are NOT extended — `/uf.fix-ci`
dispatches no review agents itself (D7 delegates to the
`/uf.review-council` command), so the shared dispatch
contract does not apply.

## Risks / Trade-offs

### R1: Misclassification routes to the wrong path

A flaky test read as a code failure wastes an iteration on a
needless fix. Mitigation: classification is log-grounded
(D5), and the human gate reviews the diagnosis and evidence
before any path executes; the human can decline.

### R2: Automated conflict resolution is unreliable

Non-trivial rebase conflicts cannot be resolved with
confidence. Mitigation: resolve only flagged files preserving
author intent, re-scan with `scan_conflict_markers`, and on
ambiguity STOP offering `git_rebase_abort` — the pre-rebase
state is preserved exactly (the `finale-check-mergeability`
precedent).

### R3: Force-push may be rejected

Branch protection or fork permissions can reject
`git_push_force_with_lease`. Mitigation: report the rejection,
preserve local commits, name the stranded commits, and STOP —
never fall back to `--force` (unbounded) or merge (D2).

### R4: Council + CI loop interaction exhausts budget

Council findings consume the same 3-iteration budget as CI
fixes, so a noisy council can starve CI repair. Accepted
trade-off: a single budget bounds total autonomous effort and
the STOP report names what remains; the human can re-invoke
the command to continue with a fresh budget.

### R5: Log volume costs tokens

`--log-failed` on a big CI failure can be large. Mitigation:
fetch failed steps only, save to a temp file, and read
targeted slices (D9) — the same bounded-consumption pattern
`uf.review-pr` uses for large diffs.
