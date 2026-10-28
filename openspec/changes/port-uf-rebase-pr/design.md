## Context

A verified personal global command
(`~/.config/opencode/commands/resolve-branch-conflict.md`)
resolves merge conflicts on a PR by rebasing its head branch
onto the base branch and force-pushing with lease. It is
verified in daily use but lives outside the repository, so
scaffolded UF repos never receive it. For this change the
source is staged byte-identically inside the workspace at
`.local-sources/resolve-branch-conflict.md` (git-excluded
scratch input) so implement-phase workers read the same
source of truth without out-of-workspace file access.

The existing coverage of this problem space:

- `/uf.finale` step 4 (change `rebase-upstream-before-push`)
  syncs the *current* feature branch with its base before
  creating the PR finale itself will own. It takes no PR
  number, resolves the base from the remote HEAD rather than
  PR metadata, and aborts on rebase conflicts.
- `/uf.finale` step 7b recovers from conflicts detected while
  watching CI for the PR finale just created, mid-command,
  behind interactive gates.
- Nothing operates on an arbitrary already-open PR by number,
  fork-aware, resolving conflicts end to end.

Originating issue: #851 (recorded as `originating_issue: 851`
in `.openspec.yaml`).

## Goals / Non-Goals

### Goals

- Port the verified command into the UF command set as
  `.opencode/commands/uf.rebase-pr.md`, invoked as
  `/uf.rebase-pr <PR_NUMBER>`, preserving the source's phase
  ordering, validation contract, error text, and guardrails.
- Follow `uf.review-pr.md` command conventions (frontmatter,
  `<protect>`, session-resume guard, Arguments section,
  Guardrails section).
- Prefer the existing deterministic git plugin tools over raw
  bash where their semantics match (determinism pack DE-001).
- Ship the scaffold mirror and keep drift tests green, so
  `uf init` deploys the command to every scaffolded repo.
- Update the three command-reference tables (AGENTS.md,
  docs/usage.md, docs/architecture.md), add the
  `CHANGELOG.md` entry, and file the documentation-gate
  issues (in-repo docs issue + website sync) before PR
  merge.
- `make check` green.

### Non-Goals

- No modification to `/uf.finale` (step 4 or 7b) — this
  command is complementary, not a replacement.
- No new plugin tools and no changes to existing plugin tool
  signatures — the port reuses the existing git tools.
- No merge, approve, or close capability — the command makes
  the PR ready to merge with a rebase once approved, nothing
  more.
- No speculative conflict-resolution automation beyond the
  flagged files — ambiguity stops the command.
- No removal or modification of the user's personal global
  command; the UF command set copy is the deliverable.
- No port of the source file itself into any committed
  artifact other than the ported command; `.local-sources/`
  is scratch input and is never committed or listed as a
  deliverable.

## Decisions

### D1: Port with fidelity to the verified source

The port preserves the source's phase ordering (arguments →
prerequisites → PR fetch/gating → checkout → remote resolution
→ rebase → conflict resolution → push → verify), its
validation regex `^[1-9][0-9]*$`, its STOP conditions and
error message text, and its nine guardrails. Rationale: the
source is verified in daily use; every deviation is a new
untested behavior and a review burden. Implementers MUST read
`.local-sources/resolve-branch-conflict.md` first and port
from it, not from memory of this design. If the staged file
is unavailable (fresh checkout, `git clean -x`, workspace
migration — it is git-excluded and exists only in this
workspace), the sanctioned fallback source is this change's
12-requirement behavior contract in
`specs/uf-rebase-pr/spec.md`, which captures the full command
contract: validation regex, six phases, nine guardrails,
exact commands, and error text.

### D2: Prefer git plugin tools where semantics match exactly

Determinism pack DE-001 directs deterministic git
choreography to executable tools. The existing tools cover
three of the four git operations exactly:

- `git_fetch({remote})` ≡ `git fetch <BASE_REMOTE>`
- `git_rebase({ref})` ≡
  `git rebase <BASE_REMOTE>/<BASE_BRANCH>`
- `git_rebase_abort()` ≡ `git rebase --abort`

Raw bash remains for `gh` calls, `git remote -v` matching,
`git status`, staging, `git rebase --continue`, and the
checkout fallback — no plugin tools exist for those, and
adding them is out of scope (Non-Goal). The exception is
bounded by a revisit condition: extraction is revisited
when a second command needs the same remote-resolution or
conflict-staging seam.

### D3: Push strategy — verified upstream, else explicit refspec

The source requires `git push --force-with-lease
<HEAD_REMOTE> <HEAD_BRANCH>`. The `git_push_force_with_lease`
plugin tool takes no refspec: it runs bare
`git push --force-with-lease`, which pushes the current branch
to its *configured upstream*. After `gh pr checkout` the
head branch's upstream usually points at the head remote's
branch, but not always (a pre-existing local branch may carry
stale tracking; the checkout fallback leaves no upstream at
all). The port therefore:

1. Verifies the checked-out branch's upstream is
   `<HEAD_REMOTE>/<HEAD_BRANCH>` (e.g. via
   `git rev-parse --abbrev-ref @{u}`);
2. Uses the plugin tool when it matches;
3. Falls back to the exact raw refspec command otherwise.

This keeps the DE-001 preference where it is safe and
guarantees the "push only to the head remote and head branch"
invariant in every case. Extending the plugin tool to accept
a refspec was rejected: it widens scope into plugin code and
tests for a single call site, violating YAGNI.

### D4: Command placement and conventions

Commands are discovered by filename under
`.opencode/commands/`; no registration is needed beyond the
file. The file follows `uf.review-pr.md` conventions: YAML
frontmatter with a `description` naming the invocation shape
(`/uf.rebase-pr #<N>`), a `<protect>` block around the
instruction body, a session-resume guard, an Arguments section
stating the pre-validation contract (no `gh` call before the
regex passes), phased steps, and a Guardrails section carrying
the source's nine rules.

### D5: Scaffold mirror and asset-list update

The command is mirrored byte-identically to
`internal/scaffold/assets/opencode/commands/uf.rebase-pr.md`
as a tool-owned asset (auto-updated by `uf init` on content
diff). `expectedAssetPaths` in `internal/scaffold/
scaffold_test.go` gains the path and its count comment moves
from 11 to 12. Drift detection (`TestEmbeddedAssets_
MatchSource`, `TestCanonicalSources_AreEmbedded`) enforces
parity in both directions, matching the pattern of the
`triage-issue` and `review-pr-subagent-split` changes.

### D6: docs/architecture.md row as a consistency extension

The routed scope lists AGENTS.md and docs/usage.md
explicitly. `docs/architecture.md` also carries a Review
Commands table that already enumerates the sibling post-PR
commands (`/uf.review-pr`, `/uf.address-feedback`); omitting
the new command would leave that table stale. The row is
included as a documentation-consistency extension, recorded
here so reviewers can trace it to a decision rather than
scope creep.

### D7: `originating_issue: 851` stays despite the CLI warning

`openspec` warns that `originating_issue` is an unrecognized
`.openspec.yaml` key (known keys: schema, created, goal,
affected_areas, initiative, skip_specs, retire_capabilities)
and ignores it. The field is not consumed by the openspec
CLI — AGENTS.md documents that `/uf.finale` reads it directly
to thread `Closes #851` into the PR body. The warning is
benign; implementers MUST NOT remove the key to silence it.

### D8: Relationship to /uf.finale — complementary, not coupled

`/uf.finale` step 4 answers "is *my* branch stale before I
create *my* PR?" and aborts on conflict. This command answers
"PR #N reports conflicts; fix it" for any open PR, resolves
the conflicts, and pushes to the head remote (fork-aware).
The two share no state, no tools, and no code paths; neither
invokes the other. Keeping them decoupled honors
composability (constitution II) and avoids destabilizing the
finale flow that `rebase-upstream-before-push` just hardened.

### D9: `.local-sources/` handling

The staged source at `.local-sources/
resolve-branch-conflict.md` is the implementation-time source
of truth (D1). It is git-excluded via `.git/info/exclude`,
MUST NOT appear in any commit, task deliverable, or scaffold
mirror, and its content flows only into the ported command
itself. Tasks reference it as reading input, never as a
deliverable.

## Risks / Trade-offs

- **History rewrite is inherent to rebase.** Mitigated by
  `--force-with-lease` (never `--force`), head-remote-only
  and head-branch-only push targets, and the base-branch
  push prohibition carried in the guardrails.
- **Conflict resolution is judgment work.** The command stops
  and offers abort on ambiguity rather than guessing; this
  trades autonomy for safety on the one step where a wrong
  resolution silently corrupts the PR author's intent.
- **`mergeable: UNKNOWN`** (GitHub still computing) is not a
  STOP condition in the verified source; the command
  proceeds. This is safe: if the PR is actually conflict-free
  the rebase is a no-op fast-forward and the lease-protected
  push rewrites nothing of others' work. Preserved for
  fidelity rather than adding an unverified poll loop.
- **`gh pr checkout` side effects.** It may add remotes or
  reconfigure tracking for the head branch. This mirrors the
  verified source behavior and is local-only; the push
  invariant is enforced by D3 regardless of tracking state.
- **Duplication with the user's personal global command.**
  The global command remains user-owned and may diverge; the
  UF command-set copy is the product. Accepted: the source's
  value was its verification, which is now banked in the
  port.
