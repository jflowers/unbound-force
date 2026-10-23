## Why

When `/uf.finale` pushes a branch and creates the PR, it never
compares the branch against the PR's *base* branch on the target
remote. `uf_finale_push_state` only compares HEAD against the
branch's own tracking ref (`@{u}`, e.g. `origin/opsx/<name>`), so
a branch can be fully in sync with its own remote branch while
many commits behind `origin/main` (or `upstream/main` on a fork).

The result: the PR is born stale. GitHub immediately shows the
"branch is out-of-date with the base branch" banner, auto-merge
queues are blocked, a manual "Update branch" click is required,
and — when the drift includes conflicting changes — CI check runs
are silently blocked from queuing (the reactive failure mode the
active `finale-check-mergeability` change addresses at the
CI-watch step, after the PR already exists).

A proactive sync between commit and push prevents the PR from
being created out of date in the first place.

## What Changes

Add a new step 4 "Sync with Base Branch" to `/uf.finale`,
between commit (step 3) and push (renumbered to step 5), backed
by a new `uf_finale_base_state` plugin tool:

- The tool resolves the target remote (`upstream` when that
  remote exists, else `origin`), resolves the base branch (the
  remote's HEAD via `git symbolic-ref`, falling back to `main`),
  fetches it, and reports how far HEAD is ahead/behind
  `<remote>/<base>`.
- When the branch is behind the base, the command presents a
  MANDATORY GATE offering: rebase onto `<remote>/<base>`
  (recommended), continue without rebase (PR will be behind), or
  abort.
- A rebase rewrites history, so the subsequent push step uses
  `git_push_force_with_lease` when the branch already has an
  upstream; a first-time push remains a normal `git_push`.
- Rebase conflicts abort cleanly via `git_rebase_abort`, report
  the conflicted files, and STOP.
- A fetch failure (e.g. offline) degrades to a warning and the
  finale proceeds exactly as it does today — soft gate, current
  behavior preserved as the floor.
- Steps after the insertion renumber (Push 4→5, PR 5→6, CI 6→7
  with 6b→7b, Return to Main 7→8, Summary 8→9); in-file cross
  references ("skip to step 4", "proceed to 6b", etc.) update
  accordingly.
- The scaffold mirrors under `internal/scaffold/assets/opencode/`
  are updated identically; drift-detection tests enforce parity.

## Capabilities

### New Capabilities
- `base-sync-check`: A deterministic pre-push check that fetches
  the PR base branch and reports ahead/behind counts of HEAD
  versus `<remote>/<base>`, distinguishing the base branch from
  the branch's own tracking upstream.
- `base-sync-gate`: A confirmation gate with a rebase action that
  brings the branch up to date with the base before push, with
  clean conflict abort and force-with-lease push semantics.

### Modified Capabilities
- `finale-push`: The push step gains force-with-lease handling
  following a step-4 rebase, and its gate surfaces the rebase
  context.
- `finale-command-sequence`: The `/uf.finale` instruction
  sequence renumbers to nine steps with the sync step inserted at
  step 4 and all cross-references updated.

### Removed Capabilities
- None.

## Impact

- **Files**:
  - `.opencode/plugins/uf-finale/index.ts` — new
    `createUfFinaleBaseStateTool` factory and tool registration.
  - `.opencode/commands/uf.finale.md` — new step 4, renumbered
    steps, updated cross-references and guardrails.
  - `.opencode/test/uf-finale.test.ts` — unit tests for the new
    tool (remote preference, base resolution, fetch failure,
    divergence counts).
  - `internal/scaffold/assets/opencode/plugins/uf-finale/index.ts`
    and
    `internal/scaffold/assets/opencode/commands/uf.finale.md` —
    identical mirror updates (drift-detection tests).
- **Behavioral**: PRs created by `/uf.finale` start up to date
  with their base branch whenever the base has advanced and the
  user confirms the rebase. Offline fetch failure preserves
  current behavior.
- **Cross-repo**: Any repo scaffolded with unbound-force tooling
  gains the behavior via a `uf init` refresh; no repo-specific
  changes are required.
- **Coordination**: Complements the active
  `finale-check-mergeability` change (reactive conflict detection
  at the CI-watch step). That change's spec text references
  pre-renumbering step numbers; its requirements are unaffected —
  see design.md for the coordination note.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The new tool returns a self-describing JSON envelope
(`{remote, baseBranch, baseRef, aheadBy, behindBy, ...}`) with a
stable contract. The command consumes this well-defined artifact
instead of parsing free-form git output. No new runtime coupling
between heroes is introduced.

### II. Composability First

**Assessment**: PASS

The check tool gathers state only; the rebase itself reuses the
existing `git_rebase` / `git_rebase_abort` tools rather than
duplicating them. The finale plugin remains independently usable
and introduces no new hero dependencies. Forks without an
`upstream` remote fall back to `origin` and keep working.

### III. Observable Quality

**Assessment**: PASS

The tool emits machine-parseable output with provenance (which
remote, which base branch, which SHA) through the standard
`success` / `failure` envelope shared by all finale tools. The
gate reports the exact counts and the exact rebase target to the
user before any history-rewriting action.

### IV. Testability

**Assessment**: PASS

The tool follows the existing factory pattern
(`createUfFinaleBaseStateTool(exec: GitExec, cwd)`) with an
injectable git executor and working directory, so every path —
remote preference, base resolution, fetch failure, and divergence
counting — is unit testable in isolation without network access
or a real remote.
