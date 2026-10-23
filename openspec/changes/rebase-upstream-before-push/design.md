## Context

The `/uf.finale` command (`.opencode/commands/uf.finale.md`, with
an identical scaffold mirror under
`internal/scaffold/assets/opencode/`) runs eight steps: branch
safety, change check, commit, push, PR creation, CI watch,
return to main, summary.

The push step calls `uf_finale_push_state`
(`.opencode/plugins/uf-finale/index.ts`), which compares HEAD
only against the branch's own tracking ref (`@{u}` — e.g.
`origin/opsx/<name>`). Nothing in the flow compares the branch
against the PR's *base* branch (`main` on the target remote).
When the base has advanced since the branch was cut, the PR is
created already out of date: GitHub shows the stale-branch
banner, auto-merge is blocked, and conflicting drift can prevent
CI check runs from queuing at all.

Two related capabilities already exist, both reactive:

- Step 7b Conflict Recovery (from `finale-conflict-resolution`):
  a five-option menu offered *after* PR creation when CI reports
  a conflict.
- `finale-check-mergeability` (fully implemented, 6/6 tasks):
  detects mergeability-blocked check runs at the CI-watch step.

Neither prevents the PR from being born stale. This change adds
the proactive path: sync with the base between commit and push.

## Goals / Non-Goals

### Goals
- PRs created by `/uf.finale` start up to date with their base
  branch whenever the base has advanced and the user confirms a
  rebase.
- A deterministic, machine-parseable check tool
  (`uf_finale_base_state`) that resolves remote, base branch,
  fetches, and reports divergence — no free-form git output
  parsing by the agent.
- Rebase execution reuses existing `git_rebase` /
  `git_rebase_abort` tools; push mode selection enforces
  force-with-lease after history rewrite.
- Offline fetch failure degrades to a warning (current behavior
  is the floor).
- Scaffold mirrors stay byte-identical (drift-detection tests).

### Non-Goals
- Updating the branch via the GitHub "Update branch" API — the
  sync is a local rebase.
- Non-default base branches (PRs targeting something other than
  the remote's default branch). Step 7b conflict recovery already
  resolves the actual PR base from PR metadata post-hoc.
- Extending base-sync to `/uf.address-feedback` or other push
  phases — noted as a future consideration, separate change.
- Auto-rebase without user confirmation — forbidden by the
  existing guardrail ("NEVER rebase/force-push without
  confirmation").
- Changing step 7b (Conflict Recovery) semantics.

## Decisions

### D1: New state-gathering tool, rebase stays compositional

`uf_finale_base_state` lives in the `uf-finale` plugin following
the existing factory pattern
(`createUfFinaleBaseStateTool(exec: GitExec, cwd)`) with the
shared `success` / `failure` envelope. It resolves, fetches, and
counts — nothing else. The rebase itself remains with the
existing `git_rebase` / `git_rebase_abort` tools orchestrated by
the command.

Rationale: Single Responsibility and Composability First — the
check is deterministic and side-effect-free (apart from the
fetch), while the rebase is a gated, history-rewriting action
that belongs behind user confirmation in the command flow. This
mirrors how `uf_finale_push_state` (check) and `git_push`
(action) already split.

### D2: Fetch inside the tool, not in command prose

The tool performs `git fetch <remote> <baseBranch>` itself
rather than the command issuing `git_fetch` then interpreting.

Rationale: the behavioral Determinism gate forbids mechanical
git choreography in command prose where an executable tool is
feasible. Remote resolution + base resolution + fetch + counting
is one atomic, testable unit; splitting it into prose steps
would make the offline path and the fork path untestable and
token-expensive.

### D3: Remote preference `upstream` → `origin`, git-only

The target remote is `upstream` when `git remote` lists it, else
`origin`. Fork detection does NOT go through `gh` — the tool
uses only git plumbing.

Rationale: consistency with `resolve_base_ref`'s
`BASE_REF_CANDIDATES` (`upstream/main`, `origin/main`, `main`)
and with step 7b's "upstream if fork, else origin" rule. Avoiding
`gh` keeps the tool testable with a fake `GitExec` and usable
offline (fork detection via `gh` already fails soft in
`uf_finale_pr_context`). A fork without an `upstream` remote
falls back to `origin` — the command warns that the origin base
may itself be stale in that case.

### D4: Base branch via symbolic ref, `main` fallback

`git symbolic-ref refs/remotes/<remote>/HEAD` resolves the
remote's default branch; failure falls back to `main`.

Rationale: honors non-`main` default branches where configured,
while `main` matches the org convention (`uf_finale_return_to_main`
hardcodes `main`). No hardcoded-only resolution.

### D5: Soft gate on fetch failure

A failed fetch returns `failure(msg, {retryable: true, code:
"BASE_SYNC_FETCH"})`. The command warns and proceeds to push.

Rationale: an offline finale MUST NOT block on a freshness check;
today's behavior (no check at all) is the floor. The failure
envelope carries the resolved remote/base so the warning is
actionable.

### D6: Rebase, not merge; conflicts abort and stop

The gate's recommended action is `git_rebase` onto
`<remote>/<baseBranch>`. On conflict: `git_rebase_abort`, report
files, STOP. No sub-agent resolution menu at this step.

Rationale: the user asked for rebase; linear history matches the
org's rebase-merge flow (summary suggests
`gh pr merge --rebase`). Keeping conflict handling minimal here
avoids duplicating step 7b's five-option recovery — a conflicted
pre-push rebase is rare (the working tree is clean and the user
is present) and STOP preserves the pre-rebase state exactly.

### D7: Push mode selection after rebase

After a step-4 rebase: `git_push_force_with_lease` when the
branch has an upstream, plain `git_push` (with `setUpstream`)
for a first push. Never `git push --force`.

Rationale: the rebase rewrites history, so a tracked branch
requires a protected force push; the existing guardrail already
mandates force-with-lease. First pushes have nothing to
overwrite.

### D8: Insert as step 4 and renumber (rejected: "3b" sub-step)

The sync step becomes step 4; Push→5, PR→6, CI→7 (6b→7b),
Return→8, Summary→9. All in-file cross-references update. The
step-2 no-changes path ("skip to step 4") now lands on the sync
step and flows to push.

Rationale: nine sequential steps read cleanly; a permanent "3b"
would be the only sequential sub-step in the file (7b is a
conditional branch of 7, not a sequence step). The design-time
audit covered only the command file and its scaffold mirror and
found no references there; the review-phase repo-wide grep
corrected that record: step-number references exist in six
sibling unarchived changes (finale-secrets-askuser-gate,
finale-reliability, mandatory-gate-hardening,
finale-dewey-commit, issue-pr-traceability, and
triage-mandatory-gate), the checkpoint-sequence table in
uf-workflow-checkpoint/design.md, and the golden-suite line
anchors. Dispositions: the sibling references are historical —
each change is fully implemented but unarchived, so its spec
text records pre-renumbering numbers (the D9 disposition); the
golden-suite anchors are the one live surface and were
refreshed in this change. Renumbering churn is contained to
the command file, its mirror, and the golden anchors.
Rejected alternative — inserting "3b" — would avoid touching
other steps' text but leaves awkward numbering forever.

### D9: Coordination with `finale-check-mergeability`

That change is fully implemented (6/6 tasks) but not yet
archived; its spec text references pre-renumbering numbers
("step 6 Watch CI Checks", "step 5a", "proceed to step 7").
After this change lands, those references describe historical
step numbers.

Rationale: its requirements are behavioral (mergeability gate,
recovery options) and remain satisfied by the renumbered
command; only the numeric labels shift. When it is archived, its
delta stands as a historical record. No implementation
coordination is required since it is already implemented against
the pre-renumbering command.

## Risks / Trade-offs

- **Renumbering churn**: any concurrent edit to `uf.finale.md`
  (canonical or mirror) textually conflicts with the renumber
  hunks. Mitigated by the corrected cross-reference audit (D8:
  sibling references historical, golden anchors refreshed) and
  by OpenSpec's implement-in-change-order practice — the later
  change rebases (fittingly, using this very feature).
- **Stale `origin` base on forks without an `upstream` remote**:
  the tool reports which remote it used; the command warns that
  a fork's `origin/main` may lag the true PR base. Accepted
  trade-off versus adding a `gh` dependency to the check.
- **Fetch cost**: one network round trip per finale run even
  when the branch is current. Accepted: `git fetch <remote>
  <branch>` is a single ref negotiation and the tool runs once
  per finale.
- **User declines rebase**: the PR is created behind the base —
  identical to today's behavior, now with an explicit warning
  and the exact behind count. Not a regression.

No [NEEDS CLARIFICATION] markers remain; all decisions above
were resolved autonomously within existing guardrails.
