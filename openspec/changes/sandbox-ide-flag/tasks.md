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

## 1. Options and Config

- [x] 1.1 Add `IDE string` field to `Options` struct in
  `internal/sandbox/sandbox.go` with GoDoc comment.
- [x] 1.2 Add `IDE string` field to `SandboxConfig`
  struct in `internal/sandbox/workspace.go` with YAML
  tag `yaml:"ide"`.
- [x] 1.3 Add IDE resolution to `DefaultConfig()` in
  `internal/sandbox/config.go`: env var
  (`UF_SANDBOX_IDE`) > default `"none"`. Follow the
  existing `Image` resolution pattern.
- [x] 1.4 Add `validIDEs` constant list and
  `validateIDE()` function in
  `internal/sandbox/devpod.go`: validates against
  `none`, `vscode`, `openvscode`, `fleet`,
  `jupyternotebook`, `cursor`. Returns error that
  includes all valid values (e.g., "unknown IDE:
  sublime, use one of: none, vscode, ...").

## 2. DevPod Backend

- [x] 2.1 Update `DevPodBackend.Create()` in
  `internal/sandbox/devpod.go`: replace hardcoded
  `"none"` in the Create args slice with `opts.IDE`.
  Call `validateIDE()` before building args.
- [x] 2.2 Update `DevPodBackend.Start()` in
  `internal/sandbox/devpod.go`: add `--ide`, `opts.IDE`
  to the `devpod up --id` args on resume.

## 3. CLI Wiring

- [x] 3.1 Add `ide` field to `sandboxCreateParams` and
  `sandboxStartParams` structs in
  `cmd/unbound-force/sandbox.go`.
- [x] 3.2 Add `--ide` flag registration to
  `newSandboxCreateCmd()` and `newSandboxStartCmd()`
  with default `"none"` and help text noting IDE
  applies to DevPod backend only.
- [x] 3.3 Wire the `ide` field through
  `runSandboxCreate()` and `runSandboxStart()` to
  `sandbox.Options.IDE`.
- [x] 3.4 Add IDE to `applySandboxConfig()` in
  `cmd/unbound-force/sandbox.go`: read `ide` from
  `.uf/config.yaml` sandbox section (via
  `config.SandboxConfig`). Resolution: CLI flag >
  env var (`DefaultConfig`) > config file
  (`applySandboxConfig`) > default `"none"`.

## 4. Tests

- [x] 4.1 Add tests for `validateIDE()` in
  `internal/sandbox/sandbox_test.go`:
  - Table-driven: each valid value accepted
  - Invalid value rejected with error containing all
    valid IDE names
- [x] 4.2 Add test for Create with IDE passthrough:
  - Verify `devpod up` args include `--ide vscode`
  - Verify default `--ide none` when IDE is empty
- [x] 4.3 Add test for Start with IDE passthrough:
  - Verify `devpod up --id <name> --ide vscode`
  - Verify default `--ide none` on resume
- [x] 4.4 Add test for IDE resolution chain following
  the `TestDefaultConfig_ImagePrecedence` pattern:
  - Flag overrides env var
  - Env var used when no flag
  - Config file used as fallback
  - Default "none" when nothing set
- [x] 4.5 Add test verifying ephemeral Podman mode
  ignores IDE: `Start()` in ephemeral mode (no
  persistent workspace) MUST NOT pass `--ide` to
  `podman run` even when `opts.IDE` is set.

## 5. Sandbox Lifecycle Fixes

- [x] 5.1 Fix `Attach()` in `internal/sandbox/sandbox.go`:
  add `isPersistentWorkspace()` check before ephemeral
  container check. Delegate to `backend.Attach()` for
  persistent workspaces (DevPod, Podman named volumes).
- [x] 5.2 Fix `Destroy()` in `internal/sandbox/sandbox.go`:
  add `isPersistentWorkspace()` check before
  `ResolveBackend()`. Handle ephemeral cleanup directly
  (stop + rm container). Report "No sandbox to destroy"
  when nothing exists.
- [x] 5.3 Add `waitForHealth()` call to
  `DevPodBackend.Start()` in
  `internal/sandbox/devpod.go` after `devpod up`
  returns and before TUI attach. Print warning and
  return gracefully on timeout.
- [x] 5.4 Add `postStartCommand` to devcontainer.json
  template in `internal/scaffold/assets/devcontainer/`:
  `nohup opencode serve --port 4096 > /tmp/opencode-server.log 2>&1 &`
- [x] 5.5 Add tests for Attach persistent workspace
  detection and Destroy ephemeral handling in
  `internal/sandbox/sandbox_test.go`.

## 6. Manual Testing Bug Fixes

- [x] 6.1 Add `waitForHealth()` call to
  `DevPodBackend.Create()` in
  `internal/sandbox/devpod.go` after `devpod up`
  returns. Match the pattern in `Start()`: print
  warning on timeout, return without error (D11).
- [x] 6.2 Add DevPod stderr suppression in
  `DevPodBackend.Create()`: when `devpod up` returns
  non-zero, call `devpod status <ws> --output json`.
  If workspace is `Running`, suppress raw stderr and
  print friendly warning. If not, report the full
  error (D12).
- [x] 6.3 Add SSH fallback to `DevPodBackend.Start()`
  in `internal/sandbox/devpod.go`: when
  `waitForHealth()` times out, run
  `devpod ssh <ws> -- nohup opencode serve --port
  4096 > /tmp/opencode-server.log 2>&1 &` and call
  `waitForHealth()` again. Print warning with
  remediation if both fail (D13).
- [x] 6.4 Replace `fmt.Fscanln` with `bufio.Scanner` in
  `runSandboxDestroy()` confirmation in
  `cmd/unbound-force/sandbox.go`. Use
  `bufio.NewScanner(p.stdin)` + `scanner.Scan()` +
  `scanner.Text()` for line-oriented reading. Treat
  any non-"y"/"yes" input (empty, "n", EOF, bare
  `\r`) as cancellation with "Cancelled." output
  (D14).
- [x] 6.5 Add tests for Create health check, stderr
  suppression (tunnel error vs real failure), Start
  SSH fallback (success and failure paths), and
  Destroy empty-input confirmation feedback.

## 7. Verification

- [x] 7.1 Run `go test -race -count=1 ./internal/sandbox/`
  and `go test -race -count=1 ./cmd/unbound-force/`
- [x] 7.2 Run `go vet ./...` and `golangci-lint run`
- [x] 7.3 Verify constitution alignment: IDE field uses
  Options DI pattern (Principle IV), feature is opt-in
  with backward-compatible default (Principle II).
- [ ] 7.4 Manual test: `uf sandbox create --backend
  devpod --ide vscode --detach` then
  `uf sandbox attach` (verify OpenCode server running).
- [ ] 7.5 Manual test: `uf sandbox destroy` with
  empty Enter, "n", and "y" inputs (verify feedback).
<!-- spec-review: passed -->
<!-- code-review: pending -->
