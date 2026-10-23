<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the same group, (b) has no dependency
  on prior tasks in the group, and (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file — parallel
  workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P] tasks
  run in parallel.
-->

## 1. Canonical implementation

- [x] 1.1 [P] Implement `createUfFinaleBaseStateTool` in
  `.opencode/plugins/uf-finale/index.ts`: remote resolution
  (`upstream` else `origin` via `git remote`), base branch
  resolution (`git symbolic-ref refs/remotes/<remote>/HEAD`
  with `main` fallback), `git fetch <remote> <baseBranch>`,
  ahead/behind counts via `git rev-list`, and the
  `success` / `failure` envelopes per the spec (fetch failure:
  `retryable: true`, code `BASE_SYNC_FETCH`). Register
  `uf_finale_base_state` in the plugin entry point alongside
  the existing tools.
- [x] 1.2 [P] Update `.opencode/commands/uf.finale.md`: insert
  step 4 "Sync with Base Branch" (tool call, `behindBy`
  branching, MANDATORY GATE with session-resume guard, rebase
  via `git_rebase` with `git_rebase_abort` on conflict, options
  for rebase / continue-without / abort, checkpoint
  `step: "sync-base"`); renumber Push→5, PR→6, CI→7 (6b→7b),
  Return to Main→8, Summary→9; update all in-file
  cross-references including the step-2 skip path; add
  force-with-lease push-mode selection to step 5 when a rebase
  occurred and the branch has an upstream.

## 2. Scaffold mirrors

- [x] 2.1 [P] Copy the updated plugin file byte-identically to
  `internal/scaffold/assets/opencode/plugins/uf-finale/index.ts`
  (drift-detection tests enforce parity).
- [x] 2.2 [P] Copy the updated command file byte-identically to
  `internal/scaffold/assets/opencode/commands/uf.finale.md`.

## 3. Tests

- [x] 3.1 [P] Add unit tests for `createUfFinaleBaseStateTool`
  in `.opencode/test/uf-finale.test.ts` using the fake
  `GitExec` pattern from the `uf_finale_push_state` tests,
  covering all spec scenarios: `upstream` remote preferred,
  `origin`-only fallback, symbolic-ref failure falling back to
  `main`, fetch failure returning the retryable
  `BASE_SYNC_FETCH` envelope, and correct ahead/behind counts
  with an unmodified working tree.
- [x] 3.2 [P] Update any tool-enumeration or registration
  surface tests (e.g. registration-surface, plugin-integration,
  golden-output-shape) that assert the uf-finale tool list to
  include `uf_finale_base_state`.

## 4. Verification and gates

- [x] 4.1 Run `make plugin-test` — the full TypeScript suite
  must pass with the 94 percent statements coverage floor
  intact (gate must not be modified).
- [x] 4.2 Run `make check` — lint, Go tests (including scaffold
  drift detection), build, and the scope-based coverage gate
  must pass, replicating CI locally.
- [x] 4.3 Assess documentation impact per the AGENTS.md
  documentation gate: add a CHANGELOG.md entry for the new
  finale capability; update AGENTS.md/README.md only if
  structure or user-facing behavior descriptions change.
- [x] 4.4 Verify constitution alignment: the tool emits
  machine-parseable envelopes with provenance (III), injects
  `GitExec` + cwd for isolated testing (IV), reuses
  `git_rebase` compositionally (II), and the command consumes
  the tool's stable JSON contract (I). Confirm no gate,
  threshold, or pinned dependency was modified.
