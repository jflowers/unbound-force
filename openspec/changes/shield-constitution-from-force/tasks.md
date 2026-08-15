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

## 1. Add `isNeverOverwrite` predicate

- [x] 1.1 Add `isNeverOverwrite(relPath string) bool` function
  in `internal/scaffold/scaffold.go`, immediately after
  `isToolOwned`. Returns `true` for
  `"specify/memory/constitution.md"`, `false` otherwise.
  Files: `internal/scaffold/scaffold.go`
  Refs: FR-001, FR-002, FR-003

- [x] 1.2 Insert guard clause in `Run()` before the
  `opts.Force` block (before line 177): if the file exists
  and `isNeverOverwrite(relPath)` returns `true`, append
  `outRel` to `result.Skipped` and `return nil`.
  Files: `internal/scaffold/scaffold.go`
  Refs: SC-001, D2

## 2. Update tests

- [x] 2.1 Rename `TestRun_ConstitutionOverwrittenWithForce` to
  `TestRun_ConstitutionProtectedWithForce` in
  `internal/scaffold/scaffold_test.go`. Update assertions:
  assert the constitution path is in `res.Skipped` (not
  `res.Overwritten`). Verify it is NOT in `res.Overwritten`.
  Verify the file content is the user's customized content,
  not the embedded starter. Remove the existing assertion
  that checks for starter template content
  (`### I. Autonomous Collaboration`).
  Files: `internal/scaffold/scaffold_test.go`
  Refs: SC-001

- [x] 2.2 [P] Add `TestIsNeverOverwrite` table-driven test in
  `internal/scaffold/scaffold_test.go` (near the existing
  `TestIsToolOwned`). Test cases:
  - `specify/memory/constitution.md` → `true`
  - `.specify/memory/constitution.md` → `false` (filesystem
    path with leading dot, not asset path)
  - `opencode/commands/uf.init.md` → `false` (tool-owned)
  - `opencode/agents/cobalt-crush-dev.md` → `false`
    (user-owned, not protected)
  - `opencode/uf/packs/default.md` → `false` (convention
    pack)
  - `""` → `false` (empty path)
  Files: `internal/scaffold/scaffold_test.go`
  Refs: SC-004, SC-005, SC-006

## 3. Verification

- [x] 3.1 Run `go test -race -count=1 ./internal/scaffold/...`
  and confirm all tests pass.

- [x] 3.2 Run `make lint` and confirm no issues.

- [x] 3.3 Verify constitution alignment: this change maintains
  Observable Quality (protected files reported in `Skipped`)
  and Testability (new predicate has table-driven test,
  integration behavior covered by existing test
  infrastructure).
<!-- spec-review: passed -->
<!-- code-review: passed -->
