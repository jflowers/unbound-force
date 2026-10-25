<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  All implementation tasks (Phases 1-3) modify the same two
  files (internal/scaffold/scaffold.go and
  internal/scaffold/scaffold_test.go) and are strictly
  ordered (hoist before table edit; production changes
  before test updates; guard test after hoist), so no
  implementation task is parallel-eligible. Phase 4 tasks
  are verification-only — they modify no source files
  (task 4.5 may touch CHANGELOG.md and file documentation
  issues) and depend on all implementation completing.
-->

## 1. Production Changes

- [x] 1.1 Hoist the `simpleTools` slice out of `initSubTools`
  (internal/scaffold/scaffold.go:1849) to a package-level
  `var simpleTools = []simpleTool{...}`, with the table contents
  unchanged at this step. Carry the comment block
  (scaffold.go:1845-1848) over so it documents the package-level
  table. This makes the real table enumerable by the guard test
  (task 3.2) — a hardcoded sentinel list in the test would not
  catch a future tool entry whose sentinel collides with an
  embedded asset. (D4, FR-020)

- [x] 1.2 Update the specify entry in the package-level
  `simpleTools` table (scaffold.go:1852-1855): change the
  sentinel from the bare `".specify"` string to
  `filepath.Join(".specify", "scripts")` (matching the
  `filepath.Join` style of the openspec and gaze entries);
  append `"--force"` to the base args, producing
  `[]string{"--here", "--integration", "opencode", "--offline",
  "--force"}`; change the conditional forceFlag from `"--force"`
  to `""` so `uf init --force` passes exactly one `--force`
  (from base args) on both the fresh-init and re-init paths. Do
  not touch the replicator, openspec, or gaze entries.
  (D1, D2; FR-004, FR-015, FR-017, FR-018)

- [x] 1.3 Change `initSimpleTool`'s sentinel-skip early return
  (scaffold.go:1976-1978) from `return nil` to
  `return &subToolResult{name: tool.result, action: "already
  configured"}` when the sentinel exists and `opts.Force` is
  false. `ExecCmd` MUST NOT be invoked on this path. Leave the
  goroutine `collect` loop's `if r != nil` guard
  (scaffold.go:1876-1878) in place as defense in depth — the
  LookPath and config-skip paths still produce no result. No
  rendering changes are needed: "already configured" is already
  in the `subToolResult` action vocabulary (scaffold.go:894-897),
  maps to the check symbol through `subToolSymbol`'s default
  case (scaffold.go:2007-2021), and `printSummary` picks the
  result up through the existing sub-results loop.
  (D3; FR-011, FR-019)

- [x] 1.4 Update the `initSimpleTool` GoDoc
  (scaffold.go:1962-1970): replace the "Returns nil if the
  sentinel already exists and Force is false" wording with a
  description of the already-configured result.
  (D3)

## 2. Test Updates

All updates in internal/scaffold/scaffold_test.go. These tests
pin the invocation contract and currently assert the old
sentinel, the old base args, or the silent nil skip.

- [x] 2.1 `TestInitSubTools_SpecifyInit` (scaffold_test.go:6248):
  update the expected recorded command to
  `specify init --here --integration opencode --offline --force`.
  (FR-004, FR-018)

- [x] 2.2 `TestInitSubTools_SpecifySkipped`
  (scaffold_test.go:6282): create the sentinel as
  `.specify/scripts` (via `os.MkdirAll`) instead of the bare
  `.specify` directory; flip the assertion from "no `.specify/`
  result" to a `.specify/` result with action
  `already configured`; update the not-invoked expected string
  to include `--force`. (FR-017, FR-019)

- [x] 2.3 `TestInitSubTools_SpecifyFailed`
  (scaffold_test.go:6330): update the `scaffoldCmdRecorder`
  error map key to
  `specify init --here --integration opencode --offline --force`.
  Also update `TestInitSubTools_SimpleToolFails_ShowsError`
  (scaffold_test.go:7984): re-key both the error and output
  `scaffoldCmdRecorder` map entries from
  `specify init --here --integration opencode --offline` to the
  `--force` invocation so the injected failure still fires.
  (FR-018)

- [x] 2.4 Update the remaining simple-tool skip tests for the
  visible-skip result —
  `TestInitSubTools_ReplicatorInitSkipsExisting` (6176),
  `TestInitSubTools_OpenSpecSkipped` (6397), and
  `TestInitSubTools_GazeSkipped` (6495): each now expects a
  `subToolResult` carrying the tool's result name with action
  `already configured` instead of no result. Also update
  `TestInitSimpleTool_SentinelExistsNoForce`
  (scaffold_test.go:8791): the sentinel-exists/Force=false
  path now returns the visible `already configured` result
  instead of nil — flip the nil-result assertion to expect
  that result while keeping the assertion that `ExecCmd` was
  never invoked. (FR-019)

- [x] 2.5 `TestInitSubTools_SpecifyForcePassthrough`
  (scaffold_test.go:8920): create the sentinel as
  `.specify/scripts`; keep asserting action `re-initialized`;
  keep the expected invocation
  `specify init --here --integration opencode --offline --force`
  and additionally assert the recorded args contain exactly one
  `--force` (now supplied by base args — specify's forceFlag is
  empty). (FR-014, FR-018)

- [x] 2.6 `TestInitSimpleTool_ForceReinitFails`
  (scaffold_test.go:8961): update the inline `simpleTool` literal
  to mirror the new specify entry (sentinel `.specify/scripts`,
  base args including `--force`, empty forceFlag) — or reference
  the package-level `simpleTools` specify entry directly — so
  the failure path is exercised against the real table shape.
  (FR-014)

- [x] 2.7 `TestInitSubTools_ConcurrentAllResults`
  (scaffold_test.go:5851): update the expected specify command
  in `expectedCmds` to include `--force`. (FR-018)

## 3. New Test Coverage

- [x] 3.1 Add `TestRun_SpecifyDelegationOnFreshInit`
  (internal/scaffold/scaffold_test.go): run the full
  `scaffold.Run()` — not `initSubTools` directly — on a fresh
  `t.TempDir()` with `LookPath` stubbed via
  `stubScaffoldLookPath(map[string]string{"specify":
  "/usr/local/bin/specify"})` and `ExecCmd` stubbed via
  `scaffoldCmdRecorder`, mirroring the stub patterns of
  `TestRun_CreatesFiles` / `TestRun_ConstitutionScaffolded`.
  Assert: (a) the recorder contains
  `specify init --here --integration opencode --offline --force`;
  (b) `.specify/memory/constitution.md` exists on disk — the
  constitution coexists with the delegation; (c) the sub-tool
  results include `.specify/` with action `initialized`. This is
  the regression test that would have caught the original bug:
  `TestInitSubTools_SpecifyInit` calls `initSubTools` directly
  and bypasses `Run()`'s scaffolding phase, and no other
  `TestRun_*` test stubs `LookPath` for specify, so CI stayed
  green while the command was broken. (D5; FR-021, FR-007)

- [x] 3.2 Add the sentinel-integrity guard test (e.g.
  `TestSimpleToolsSentinelsNotScaffolded`): enumerate the
  package-level `simpleTools` table (task 1.1); walk the embedded
  assets (`fs.WalkDir(assets, "assets", ...)`, scaffold.go:206)
  mapping each asset path through `mapAssetPath`
  (scaffold.go:454); assert that no mapped target path equals,
  or is a descendant of, any `simpleTools` sentinel path. All
  four current sentinels are clear today (`assets/specify/`
  contains only `memory/constitution.md`), so the test pins the
  invariant mechanically — a future embedded asset that
  recreates this bug's precondition fails CI. (D4; FR-020)

## 4. Verification

- [x] 4.1 Run `go vet ./internal/scaffold/...` and
  `golangci-lint run ./internal/scaffold/...` — no new lint
  warnings.

- [x] 4.2 Run `go test -race -count=1 ./internal/scaffold/...`
  — all existing and new tests pass.

- [x] 4.3 Run `make check` — lint, test, build, coverage-gate,
  and plugin-test all pass (full CI parity per AGENTS.md; Go
  tests run with `-race -count=1`).

- [x] 4.4 Verify constitution alignment: Observable Quality
  (Principle III) — sentinel skips now render as "already
  configured" lines through the existing summary pipeline;
  Testability (Principle IV) — the original bug was a
  `Run()`-level test gap, now closed by task 3.1; Deterministic
  Execution (Principle VI) — the sentinel and invocation
  contracts live in the data table and are enforced mechanically
  by the guard test.

- [x] 4.5 Documentation gate: assess `CHANGELOG.md` for a change
  entry describing the user-facing behavior fix (fresh
  `uf init` with specify installed now yields a full Speckit
  framework plus the starter constitution; existing installs
  report "already configured" instead of silently skipping),
  including the
  `(Spec: openspec/changes/fix-init-speckit-sentinel/)`
  back-reference and a mention of the
  `setup.tools.specify.method: skip` escape hatch for users
  who want a constitution-only `.specify/`. File BOTH
  tracking issues before PR merge:
  (a) the repo AGENTS.md documentation gate — a docs issue
  against unbound-force/unbound-force covering the docs/
  pages that describe the affected behavior:
  docs/architecture.md ("What `uf init` Does", "Companion
  tools", and "Sub-tool Delegation" sections — the
  "silently skipped" wording now covers only the
  binary-missing path, since sentinel skips render visible
  "already configured" lines per FR-019),
  docs/cli-reference.md (`uf init` section, extending the
  existing `setup.tools.<tool>.method: skip` note — currently
  dewey-only — to cover `setup.tools.specify.method: skip`),
  docs/usage.md (init workflows, including the specify-skip
  escape hatch), and QUICKSTART.md (init walkthrough).
  Before filing, search open issues under BOTH the
  `documentation` and `docs` labels plus a keyword search on
  "uf init"; reconcile unbound-force/unbound-force#478
  ("docs: update uf init documentation to reflect embedded
  starter constitution", label `docs`, filed 2026-08-13,
  still open, covering the same pages): extend its scope,
  cross-reference the new issue from it, or close it as
  superseded — and record the disposition. File the new
  issue with the `documentation` label;
  (b) the org constitution's Cross-Repo Documentation rule —
  a tracking issue in the unbound-force/website repository
  for the user-facing behavior change.
  `AGENTS.md` and `README.md` need no changes — no
  structural, build-command, or description changes.
