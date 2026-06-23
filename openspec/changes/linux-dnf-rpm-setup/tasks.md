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

## 1. Fix Doctor Hint Bugs

- [x] 1.1 Fix `genericInstallCmd("replicator")` in
  `internal/doctor/environ.go` — change return value
  from `"brew install unbound-force/tap/replicator"`
  to `"Download from https://github.com/unbound-force/replicator/releases"`.
- [x] 1.2 Add `dnfInstallCmd(toolName string) string`
  function to `internal/doctor/environ.go`, parallel
  to `homebrewInstallCmd()`. Return dnf commands ONLY
  for tools installable via dnf:
  `go` -> `dnf install -y golang`,
  `node` -> `dnf install -y nodejs`,
  `gh` -> `dnf install -y gh`,
  `podman` -> `dnf install -y podman`,
  `gaze` -> `sudo dnf install <RPM URL hint>`,
  `replicator` -> `sudo dnf install <RPM URL hint>`,
  default -> `dnf install -y <toolName>`.
  For tools NOT in Fedora repos (ollama, devpod,
  dewey), return empty string to fall through to
  `genericInstallCmd()`.
- [x] 1.3 Add `case ManagerDnf:` to
  `managerInstallCmd()` in `internal/doctor/environ.go`
  — call `dnfInstallCmd(toolName)`. If the result is
  empty, fall through to `genericInstallCmd(toolName)`.
- [x] 1.4 Add tests in `internal/doctor/environ_test.go`.
  Table-driven: verify each tool returns the expected
  dnf command via `dnfInstallCmd()`. Verify
  `installHint()` returns dnf hints when `ManagerDnf`
  is detected and `ManagerHomebrew` is absent. Verify
  that when both `ManagerHomebrew` and `ManagerDnf`
  are detected, `installHint()` returns Homebrew hints
  (Homebrew takes priority).

## 2. Add dnf Fallback to installPodman()

- [x] 2.1 Add `resolveMethod("podman", env, "homebrew",
  "dnf")` dispatch to `installPodman()` in
  `internal/setup/setup.go`, following the `installGH()`
  pattern. Switch on the result:
  `"homebrew"` -> existing brew install path.
  `"dnf"` -> `opts.ExecCmd("dnf", "install", "-y",
  "podman")`. On success, proceed to macOS machine
  init (skipped on Linux via `opts.GOOS`) and smoke
  test. On failure, return `action: "failed"` with
  actionable message including sudo guidance.
  default -> skip with download link.
  Update dry-run to reflect the new dispatch.
- [x] 2.2 Add tests for `installPodman()` dnf fallback
  in `internal/setup/setup_test.go`. Table-driven:
  dnf detected + no Homebrew -> installs via dnf
  (assert `action: "installed"`, `detail: "via dnf"`);
  dnf install fails -> returns failed with actionable
  message (assert `action: "failed"`, detail contains
  sudo guidance);
  `PackageManager: "dnf"` + Homebrew available ->
  uses dnf, not Homebrew;
  both managers available in auto mode -> uses
  Homebrew (first in fallback chain);
  dry-run + dnf detected -> shows dnf command.

## 3. Add Curl Installer Fallback to installOllama()

- [x] 3.1 Update `installOllama()` in
  `internal/setup/setup.go`: after the
  `!HasManager(env, ManagerHomebrew)` check, add the
  `YesFlag`/`IsTTY` guard matching `installOpenCode()`
  pattern (line 552):
  ```
  if !opts.YesFlag && !opts.IsTTY() {
      return stepResult{..., action: "skipped",
          detail: "curl|bash install requires --yes flag or interactive terminal"}
  }
  ```
  Then execute:
  `opts.ExecCmd("bash", "-c", "curl -fsSL https://ollama.com/install.sh | sh")`.
  On success, return `action: "installed"`,
  `detail: "via curl installer"`. On failure, return
  `action: "failed"`, `detail: "curl install failed"`.
  Update dry-run path: when Homebrew is absent, show
  `"Would install via: curl -fsSL https://ollama.com/install.sh | sh"`.
- [x] 3.2 Add tests for `installOllama()` curl fallback
  in `internal/setup/setup_test.go`. Table-driven:
  YesFlag true + no Homebrew -> installs via curl
  (assert `action: "installed"`,
  `detail: "via curl installer"`);
  IsTTY true + YesFlag false + no Homebrew -> installs
  via curl;
  IsTTY false + YesFlag false + no Homebrew -> skips
  (assert `action: "skipped"`, detail contains
  "requires --yes flag or interactive terminal");
  curl command fails -> returns failed (assert
  `action: "failed"`, `detail: "curl install failed"`);
  dry-run + no Homebrew -> shows curl command.

## 4. Add Binary Download Fallback to installDevPod()

- [x] 4.1 Add `devpodBinaryURL()` helper to
  `internal/setup/setup.go` that constructs the GitHub
  Releases download URL for the DevPod CLI binary
  using `rpmArch()` for architecture detection.
- [x] 4.2 Update `installDevPod()` in
  `internal/setup/setup.go`: after the Homebrew check,
  add `YesFlag`/`IsTTY` guard (matching Ollama pattern).
  If confirmed, download binary via curl, install with
  `sudo install -c -m 0755`, clean up temp file.
  On failure, return actionable error with URL.
  Update dry-run to show binary download URL.
- [x] 4.3 Add tests for `installDevPod()` binary
  download fallback: YesFlag true -> downloads binary;
  IsTTY true -> downloads binary; both false -> skips;
  download fails -> returns failed; dry-run shows URL.

## 5. Documentation Updates

- [x] 5.1 [P] Update `README.md` — add Fedora/RHEL
  install section showing `dnf install` for the RPM
  alongside the existing `brew install` instructions.
- [x] 5.2 [P] Update `QUICKSTART.md` — add Linux-native
  instructions for `uf setup` explaining that dnf
  is used automatically on Fedora when Homebrew is
  absent.
- [x] 5.3 [P] Update embedded scaffold asset
  `internal/scaffold/assets/opencode/commands/review-council.md`
  — change Gaze install hint from brew-only to include
  dnf alternative.
- [x] 5.4 [P] Update embedded scaffold asset
  `internal/scaffold/assets/opencode/commands/uf-init.md`
  — change upgrade hint from brew-only to include
  dnf alternative.
- [x] 5.5 [P] Update embedded scaffold asset
  `internal/scaffold/assets/opencode/agents/cobalt-crush-dev.md`
  — change Gaze install hint to include dnf.
- [x] 5.6 [P] Update deployed files:
  `.opencode/agents/cobalt-crush-dev.md`,
  `.opencode/agents/gaze-reporter.md`,
  `.opencode/commands/review-council.md`,
  `.opencode/commands/uf-init.md` — same hint changes.
  Note: `.opencode/agents/gaze-reporter.md` is not
  scaffolded from an embedded asset — it is a
  direct edit.
- [x] 5.7 [P] Add CHANGELOG.md entry documenting the
  fix for issue #268: `uf setup` auto mode now falls
  back to dnf for Podman and curl installer for Ollama
  when Homebrew is absent. Doctor hints now show
  dnf commands on Fedora systems.

## 6. Verification

- [x] 6.1 Run `make check` — all tests pass, lint
  clean, build succeeds.
- [x] 6.2 Run `go test -race -count=1 ./internal/setup/`
  — verify new tests pass in isolation.
- [x] 6.3 Run `go test -race -count=1 ./internal/doctor/`
  — verify new tests pass in isolation.
- [x] 6.4 Manual smoke test: `uf setup --dry-run` on a
  system without Homebrew — verify Podman shows dnf,
  Ollama shows curl installer intent.

## 7. Constitution Alignment Verification

- [x] 7.1 Verify Composability First: each tool's
  fallback chain degrades gracefully — Podman via
  dnf, Ollama via YesFlag/IsTTY-gated curl, DevPod
  skip with download link. No mandatory dependencies.
- [x] 7.2 Verify Testability: all new code uses
  injectable dependencies (`LookPath`, `ExecCmd`,
  `YesFlag`, `IsTTY` on the Options struct). No new
  injectable fields added. No tests require network
  access or stdin interaction.
- [x] 7.3 Verify Security by Default: Ollama curl
  installer is gated by YesFlag/IsTTY. Non-interactive
  mode without --yes skips the installer. Trade-off
  documented in proposal Constitution Alignment
  section.
<!-- spec-review: passed -->
<!-- code-review: passed -->
