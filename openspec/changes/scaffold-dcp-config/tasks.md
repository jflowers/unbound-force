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

## 1. Implement `configureDCPConfig()` function

- [x] 1.1 Add `configureDCPConfig(opts *Options) []subToolResult`
  to `internal/scaffold/scaffold.go`. Follow the
  `configureOpencodeJSON()` pattern: check DryRun, read file
  (handle not-exist vs error), strip JSONC comments before
  unmarshal, check/add `compress.protectTags`, write if changed.
  Return `[]subToolResult` with name `"dcp.jsonc"`.
- [x] 1.2 Add the call to `configureDCPConfig(opts)` in
  `initSubTools()` immediately after `configureOpencodeJSON(opts)`
  at line 1375, collecting results via `collect()`.

## 2. Update test infrastructure

- [x] 2.1 [P] Add `.opencode/dcp.jsonc` to the
  `knownNonEmbeddedFiles` map in `scaffold_test.go` (around
  line 1185) to prevent drift test failures.
- [x] 2.2 [P] Add unit tests for `configureDCPConfig()` in
  `scaffold_test.go` covering the spec scenarios:
  - File absent: creates with full JSONC content
  - File exists with `protectTags: true`: skips (no write)
  - File exists without `protectTags`: adds it (updates)
  - DryRun: no file I/O, returns "dry-run"
  - Force: overwrites regardless of existing content
  - Read error (non-ENOENT): returns error result
  - Malformed JSON: returns error result

## 3. Add doctor health check

- [x] 3.1 Add a DCP config content check to
  `checkScaffoldedFiles()` in `internal/doctor/checks.go`,
  after the `.specify/` check. The check MUST:
  - Read `.opencode/dcp.jsonc` via `opts.ReadFile`
  - Strip JSONC comments (inline logic, same approach as
    scaffold's `stripJSONCComments`)
  - Parse as JSON and check for `compress.protectTags: true`
  - Return `Pass` ("protectTags enabled"), `Fail` ("not found",
    hint "Run: uf init"), `Warn` ("protectTags not enabled",
    hint "Run: uf init --force"), or `Warn` ("malformed config",
    hint "Run: uf init --force")
- [x] 3.2 [P] Add unit tests for the DCP config doctor check
  in `internal/doctor/doctor_test.go` covering:
  - File present with correct config: Pass
  - File missing: Fail
  - File present without protectTags: Warn
  - File present with malformed JSON: Warn

## 4. Verify

- [x] 4.1 Run `make test` (go test -race -count=1 ./...)
- [x] 4.2 Run `make lint` (go vet + golangci-lint)
- [x] 4.3 Verify constitution alignment: confirm the function
  uses injectable I/O (Testability), returns observable
  `subToolResult` and `CheckResult` (Observable Quality), and
  preserves agent session state via protect tags (Autonomous
  Collaboration).

<!-- spec-review: passed -->
<!-- code-review: passed -->
