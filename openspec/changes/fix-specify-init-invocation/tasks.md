<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file --
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Update specify invocation (scaffold.go)

- [x] 1.1 In `internal/scaffold/scaffold.go`, change
  the specify entry in `simpleTools` (line 1500-1501)
  from `nil` extraArgs to
  `[]string{"--here", "--integration", "opencode", "--offline"}`.
  The entry should read:
  ```go
  {"specify", ".specify", ".specify/",
      "Speckit framework",
      []string{"--here", "--integration", "opencode", "--offline"}},
  ```

## 2. Update scaffold tests

- [x] 2.1 In `internal/scaffold/scaffold_test.go`,
  update `TestInitSubTools_SpecifyInit` (line 4089):
  change the expected call from `"specify init"` to
  `"specify init --here --integration opencode --offline"`.

- [x] 2.2 In `internal/scaffold/scaffold_test.go`,
  update `TestInitSubTools_SpecifySkipped` (line 4121):
  change the checked call from `"specify init"` to
  `"specify init --here --integration opencode --offline"`.
  **Note**: This is a negative assertion — the test
  verifies specify is NOT called when `.specify/` exists.
  The string update is critical: without it, the old
  check `"specify init"` would no longer match the new
  call string, causing the guard to silently false-pass
  even if specify was incorrectly invoked.

- [x] 2.3 In `internal/scaffold/scaffold_test.go`,
  update `TestInitSubTools_SpecifyFailed` (line 4150):
  change the error map key from `"specify init"` to
  `"specify init --here --integration opencode --offline"`.

- [x] 2.4 In `internal/scaffold/scaffold_test.go`,
  update `TestInitSubTools_SimpleToolFails_ShowsError`
  (lines 6359, 6362): change both the error map key
  and output map key from `"specify init"` to
  `"specify init --here --integration opencode --offline"`.
  **Note**: Line 6397 (`specifyResult.detail` contains
  `"specify init:"`) is unaffected — the detail format
  uses the tool name (`"specify"`) from `initSimpleTool`,
  not the full command string.

- [x] 2.5 In `internal/scaffold/scaffold_test.go`,
  update `TestInitSubTools_AllToolsInitialized`
  (line 3720): change `"specify init"` to
  `"specify init --here --integration opencode --offline"`
  in the `expectedCmds` slice.

**N/A**: `TestInitSubTools_SpecifyNotInstalled` (line 4127)
  — no update needed; this test does not assert command
  strings, only that no `.specify/` result is produced
  when the binary is absent.

## 3. Update spec 027 assumption

- [x] 3.1 [P] In `specs/027-externalize-tool-init/spec.md`
  (lines 307-309), update the assumption to reflect
  the new CLI contract. Change from:
  "The `specify init` command is non-interactive when
  run without a project name argument (creates
  `.specify/` in the current directory)."
  To:
  "The `specify init` command requires explicit flags
  for non-interactive operation: `--here` (current
  directory), `--integration opencode` (agent
  selection), and `--offline` (bundled assets)."

## 4. Update CHANGELOG

- [x] 4.1 [P] Add a bugfix entry to `CHANGELOG.md`
  under the Unreleased section:
  "Fixed `uf init` failing to create `.specify/`
  directory due to upstream specify-cli interface
  changes (Fixes #216)."

## 5. Documentation

- [x] 5.1 [P] File a documentation issue in
  `unbound-force/website` to update the `uf init` CLI
  reference for the new specify initialization behavior
  (constitution Development Workflow MUST rule).

## 6. Verification

- [x] 6.1 Run `go test -race -count=1 ./internal/scaffold/...`
  and confirm all 5 updated specify-related tests pass.
- [x] 6.2 Run `go test -race -count=1 ./...` to confirm
  no regressions.
- [x] 6.3 Run `go vet ./...` to confirm no vet issues.
- [x] 6.4 Re-read `proposal.md` constitution alignment
  section and confirm no implementation decisions
  contradicted the assessments against principles I-V.

**Coverage strategy**: Unit tests only — update 5 existing
mock-based tests to verify argument construction. No
integration or e2e tests required for this bugfix. The
mocked tests verify `initSimpleTool` passes the correct
arguments; real CLI contract compatibility is out of
scope per design risk R3. No coverage regression in
`internal/scaffold/` (CI coverage ratchet enforced).
