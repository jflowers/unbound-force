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

Scope: production code is untouched (design D4). The
runtime unification landed on main with commit e4bb9953;
these tasks pin the merged behavior and reconcile the
spec with it. All three test tasks modify
`internal/gate/gate_test.go`, so none carry `[P]`
(MP-017).

## 1. Test pins in internal/gate/gate_test.go

- [ ] 1.1 Detached-literal-HEAD Run-level pin
      (GATE-FR-008) — classification: judgment (test
      authorship). Add a Run-level test mirroring
      `TestRun_PRPhase_DetachedHead_CIRefMain_Fails`
      (`internal/gate/gate_test.go:1647`) but with no
      recoverable CI ref: `t.TempDir()` fixture via
      `scaffoldOpenSpec` with tasks.md carrying
      `<!-- code-review: passed -->`, `initGitRepo`,
      then `runGit(t, dir, "checkout", "--detach")`,
      with `t.Setenv` pinning `GITHUB_HEAD_REF=""` and
      `GITHUB_REF_NAME=""`. Assert
      `Run(Options{TargetDir: dir, Phase: "pr"})`
      returns no error, the not-on-main check passes,
      and `report.Branch` records the literal `"HEAD"`
      (Detached HEAD state scenario; design D4a).

- [ ] 1.2 Attached-main provenance pin (GATE-FR-008) —
      classification: judgment (test authorship).
      Extend `TestRun_PRPhase_FailOnMain`
      (`internal/gate/gate_test.go:1727`) with an
      assertion that `report.Branch` records `"main"`
      alongside the existing failure assertions
      (PR phase fails on main scenario; design D4b).

- [ ] 1.3 Timeout-classification pin (GATE-FR-008) —
      classification: judgment (test authorship). Add a
      unit test calling `gitError`
      (`internal/gate/gate.go:208`) with an
      already-expired context —
      `context.WithTimeout(context.Background(), 0)`,
      whose deadline is due at construction — and a
      non-nil sentinel error; skip when git is not in
      PATH (the classifier runs `LookPath` first).
      Assert the returned error names the 10s
      `gitCommandTimeout` bound
      (`internal/gate/gate.go:18`) — "git did not
      respond within 10s" — with zero wall-clock
      waiting (Git invocation times out scenario;
      design D4c).

- [ ] 1.4 Phase checkpoint — classification:
      deterministic (exact-command verification;
      orchestrator-executed phase checkpoint via the
      pre-flight skill's hard-gate machinery, not a
      uf_delegate_command target). Binding (DE-008):
      no repo skill or script wraps the scoped
      two-package command — searched repo-root
      `Makefile` targets and `.opencode/skills/`; the
      `test` target runs `./...` unscoped — so the
      exact command runs directly. Run
      `go test -race -count=1 ./internal/gate/...
      ./cmd/unbound-force/...` and require green,
      including the pre-existing
      `TestRun_PRPhase_DetachedHead_CIRefMain_Fails`
      regression, which stays the behavioral pin for
      issue #938 criterion 1 (no second `git rev-parse`
      on the happy path). Phase 2 MUST NOT begin while
      this checkpoint fails (MP-018); flip tasks to
      `[x]` only as their own verification passes
      (MP-019).

## 2. Documentation

- [ ] 2.1 CHANGELOG entry — classification: judgment
      (authorship). Add an Unreleased entry under
      `### Changed` in `CHANGELOG.md`, following the
      repo's `- <change-name>: <summary>` format:
      unify-checknotonmain-with-the-shared-branch-resolution
      amends GATE-FR-008 so not-on-main consumes the
      once-per-run branch resolution (GATE-FR-012)
      instead of spawning its own `git rev-parse`;
      relative to the previously documented spec, a
      detached CI checkout whose recovered ref is main
      now fails not-on-main (relative to the merged
      code, runtime behavior is unchanged); Run-level
      provenance and timeout-classification test pins
      added (issue #938).

- [ ] 2.2 Documentation-gate assessment —
      classification: judgment. Assess per the repo's
      documentation gate before marking the change
      complete: `AGENTS.md` — no structural change
      (test pins and spec artifacts only), no update
      needed; `README.md` — no description change;
      documentation issue — the change is test-only
      plus spec artifacts, so verify it against the
      documentation-issue exemption list and record the
      conclusion (expected: exempt) for the
      `/uf.finale` PR body.

## 3. Verification

- [ ] 3.1 CI parity (issue #938 criterion 5) —
      classification: deterministic (exact-command
      verification; skill/script reference: repo-root
      `Makefile`, targets `build`, `lint`,
      `coverage-gate`). Replicate the checks
      `.github/workflows/ci_local.yml` runs against the
      touched packages: `go build ./...`,
      `go test -race -count=1 -coverprofile=coverage.out
      ./...`, `make coverage-gate`, `make lint`. All
      green before the change is reported complete.

- [ ] 3.2 Constitution alignment — classification:
      judgment. Verify the completed work against the
      proposal's PASS assessments: I Autonomous
      Collaboration (report stays self-describing; the
      provenance pins close the one-report-two-branches
      divergence) / II Composability (no new
      dependencies or extension surface) / III
      Observable Quality (`report.Branch` equals the
      branch not-on-main evaluated, pinned in every
      resolution mode) / IV Testability (`t.TempDir()`
      git fixtures, pinned CI-ref environment, expired
      context instead of wall clock — no external
      services) / V Security by Default (branch
      protection holds on headless main; no gate
      weakened) / VI Deterministic Execution (no new
      git spawns, no procedural prose).

- [ ] 3.3 Change validation — classification:
      deterministic (exact-command verification).
      Binding (DE-008): no repo wrapper exists for
      the validator — searched repo-root `Makefile`
      targets, `.opencode/skills/`, and
      `.uf/scripts/`; `openspec` is an external CLI
      invoked directly. Run
      `openspec validate
      unify-checknotonmain-with-the-shared-branch-resolution
      --strict` and require the established output
      shape (prose-profile precedents:
      unleash-interactive-clarify task 5.4 and
      clarification-marker-superset; pack-sanctioned
      interim prose guard, DE-001 extraction
      candidate): the
      archive-order INFO — gate-command target spec
      does not exist until `uf-gate` archives (design
      D3) — plus the `originating_issue`
      unrecognized-key warning; no other findings.

<!-- scaffolded by uf vdev -->
