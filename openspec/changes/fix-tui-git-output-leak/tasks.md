<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Live plugin cleanup

Remove the echo layer from the live plugin trees. All
tool output must flow exclusively through JSON result
envelopes; errors must flow through failure(msg).

- [x] 1.1 [P] Remove all 18 console.log/console.error
      calls from .opencode/plugins/uf-workflow/index.ts
      spanning git_fetch, git_push,
      git_push_force_with_lease, git_merge,
      git_merge_abort, git_rebase, git_rebase_abort,
      git_conflict_files, and git_commit_no_edit
      handlers. Delete the statements outright; do not
      replace them with a logger. Confirm every handler
      still returns its JSON result envelope and still
      calls failure() on subprocess errors.
- [x] 1.2 [P] Remove all 32 console.log/console.error
      calls from .opencode/plugins/uf-finale/index.ts
      spanning startup, stage, commit_context,
      push_state, pr_context, create_pr, ci_poll, and
      return_to_main handlers, including the ci_poll
      30-second progress messages. Then enrich the
      uf_finale_stage success envelope with a
      files: string[] field listing every staged file
      path (empty array when nothing is staged) so the
      staged file list survives the console removal.
      Confirm every handler still returns its JSON
      result envelope and still calls failure() on
      subprocess errors.

## 2. Scaffold asset mirror

Mirror both edited live plugins into the embedded
scaffold tree. Copies must be byte-identical; the Go
drift-detection tests (make test) enforce the sync.

- [x] 2.1 [P] Copy .opencode/plugins/uf-workflow/index.ts
      to internal/scaffold/assets/opencode/plugins/
      uf-workflow/index.ts and verify byte equality
      (e.g. shasum both files).
- [x] 2.2 [P] Copy .opencode/plugins/uf-finale/index.ts
      to internal/scaffold/assets/opencode/plugins/
      uf-finale/index.ts and verify byte equality
      (e.g. shasum both files).

## 3. Verification

- [x] 3.1 Grep all four modified files
      (.opencode/plugins/{uf-workflow,uf-finale}/
      index.ts and internal/scaffold/assets/opencode/
      plugins/{uf-workflow,uf-finale}/index.ts) for
      console.log, console.error, console.info,
      console.warn, console.debug, console.trace,
      process.stdout.write, process.stderr.write, and
      Bun.write. The result MUST be zero matches.
- [x] 3.2 Run make check (lint, Go tests including
      embedded asset drift detection, build, coverage
      gate, and the plugin-test TypeScript suite:
      unit, integration, smoke, coverage); it MUST
      pass. Add a unit test asserting the new files
      field on uf_finale_stage lists staged paths and
      defaults to an empty array — the field has zero
      existing coverage. Add a spy-based regression
      test in both uf-workflow.test.ts and
      uf-finale.test.ts: vi.spyOn(console, "log"/
      "error") around every handler invocation
      (success and error paths via the existing
      invokeTool helper and mock GitExec), asserting
      zero terminal writes per handler — the test
      MUST fail on the pre-fix code and pass after
      the fix (TC-006).
- [x] 3.3 Verify constitution alignment against
      .specify/memory/constitution.md (all five
      principles): autonomous collaboration (envelope
      remains the artifact boundary), composability
      (no new dependencies), observable quality
      (machine-parseable envelopes preserved),
      testability (make check, including plugin-test,
      gates the change), and security by default
      (reduced terminal exposure of branch names, PR
      URLs, and CI details).
- [x] 3.4 Complete the documentation gate (see
      proposal.md Documentation Impact): write the
      CHANGELOG.md entry; reference and update docs
      issue #710 (envelope-only output, files array,
      silent ci_poll); file the constitution-mandated
      unbound-force/website tracking issue before PR
      merge; assess .opencode/commands/uf.finale.md and
      its scaffold mirror for the files-array envelope
      change; and record the supersession of
      finale-token-reduction's documented TUI-output
      behavior IN THAT CHANGE'S OWN ARTIFACTS so
      archive-time spec sync does not carry the stale
      requirements forward: annotate or strike the
      "MAY print full git output to TUI via
      console.log()" clause (Git operation tools
      requirement) and the "SHOULD log the file list
      to TUI before staging" clause (uf_finale_stage
      requirement) in
      openspec/changes/finale-token-reduction/specs/
      plugin-tools.md, and add a supersession note to
      finale-token-reduction's proposal.md pointing
      at this change.
<!-- scaffolded by uf vdev -->
