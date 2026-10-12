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

## 1. Plugin scaffold and config

- [x] 1.1 Create `.opencode/plugins/uf-workflow/index.ts`
  with plugin skeleton (imports, plugin export, server
  hook that captures `input.client` and project root).
  Define `ProgressState` interface, `sanitizeBranch()`
  helper, `resolveKey()` helper (auto-detect branch via
  `git rev-parse`, sanitize, or use explicit key),
  `readState()` / `writeState()` / `deleteState()` file
  I/O helpers with 0o700 dir / 0o600 file permissions.
  Implement and register `checkpoint`, `get_progress`,
  and `clear_progress` tools per FR-001 through FR-007.
- [x] 1.2 Add `.uf/progress/` to `.gitignore`
- [x] 1.3 Verify the plugin is registered in
  `opencode.json` (already done by uf-workflow-scaffold);
  confirm no duplicate entry exists

## 2. Tests

- [x] 2.1 Create `.opencode/test/uf-workflow.test.ts`
  with unit tests for: (a) `sanitizeBranch` — slash
  replacement, special char removal, truncation,
  detached HEAD error; (b) `checkpoint` — first call
  creates state, subsequent merges data, duplicate step
  idempotent; (c) `get_progress` — returns state or null;
  (d) `clear_progress` — deletes file, idempotent when
  missing; (e) file permissions (0o700 dir, 0o600 file);
  (f) explicit key override bypasses branch detection.
  Use temp directories for isolation.
- [x] 2.2 Update `.opencode/test/scratch-smoke.test.ts`
  to activate the `uf-workflow` plugin and verify it
  registers exactly `["checkpoint", "get_progress",
  "clear_progress"]`.

## 3. Command file updates

- [x] 3.1 Update `.opencode/commands/uf.unleash.md`:
  Replace execution checklist checkbox editing with
  `checkpoint` calls per step. Replace HTML comment
  marker detection (`<!-- spec-review: passed -->`,
  `<!-- code-review: passed -->`) with `get_progress`
  resume detection. Add `clear_progress` at successful
  completion. Keep TodoWrite for session visibility but
  initialize from checkpoint state on resume.
- [x] 3.2 [P] Update `.opencode/commands/uf.finale.md`:
  Replace execution checklist checkbox editing with
  `checkpoint` calls per step. Add `get_progress` at
  start for resume. Add `clear_progress` at end.
- [x] 3.3 [P] Update
  `.opencode/commands/uf.review-council.md`: Replace
  execution checklist checkbox editing with `checkpoint`
  calls. Add `get_progress` / `clear_progress`.
- [x] 3.4 [P] Update
  `.opencode/commands/uf.review-pr.md`: Add `checkpoint`
  calls per step. Add `get_progress` / `clear_progress`.
  Use `key: "pr-<N>"` for PR-scoped state.
  *(No-op: file does not use the execution checklist
  pattern being replaced.)*
- [x] 3.5 [P] Update
  `.opencode/commands/uf.triage-issue.md`: Add
  `checkpoint` calls per step. Add `get_progress` /
  `clear_progress`.
  *(No-op: file does not use the execution checklist
  pattern being replaced.)*
- [x] 3.6 [P] Update
  `.opencode/commands/uf.address-feedback.md`: Replace
  ad-hoc `.uf/feedback/pr-<N>/state.json` writes with
  `checkpoint` calls using `key: "pr-<N>"`. Replace
  execution checklist checkbox editing. Add
  `get_progress` / `clear_progress`.

## 4. Scaffold sync and contract tests

- [x] 4.1 Copy canonical
  `.opencode/plugins/uf-workflow/index.ts` to
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`.
  Verify `TestEmbeddedAssets_MatchSource` passes
  (FR-008).
- [x] 4.2 Sync all modified command files to their
  scaffolded copies under
  `internal/scaffold/assets/opencode/commands/`.
- [x] 4.3 Update contract test assertions in
  `internal/scaffold/scaffold_test.go` if needed for
  new checkpoint tool references in command files.

## 5. Verification

- [x] 5.1 Run `make plugin-test` — all tests pass,
  branch coverage gate met.
- [x] 5.2 Run `make check` — full CI parity (lint, test,
  build, coverage gate, plugin tests).
- [x] 5.3 Verify constitution alignment: `checkpoint`
  produces self-describing JSON artifacts (Principle I),
  plugin is independently installable (Principle II),
  state files are machine-parseable with provenance
  (Principle III), all tools testable in isolation
  (Principle IV), file permissions are restrictive
  (Principle V).

<!-- spec-review: passed -->
<!-- code-review: passed -->
