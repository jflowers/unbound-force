## Context

The `setup-auto-native-fallback` change added
`resolveMethod()`, `installViaGo()`, and dnf/go-install
fallbacks for Gaze, Replicator, Dewey, and GH CLI. The
`linux-cross-platform-install` change added
`installViaRpm()`, `ManagerDnf` detection, and RPM
packaging. Two tools remain without native Linux
fallbacks: Podman and Ollama. DevPod has no automated
Linux installer (verified: `https://devpod.sh/install.sh`
returns 404). Additionally, the doctor hint system still
returns Homebrew commands on Fedora systems because
`managerInstallCmd()` has no `ManagerDnf` case.

## Goals / Non-Goals

### Goals
- Fix doctor hints to return dnf commands on Fedora
- Add `dnf install -y podman` fallback to
  `installPodman()`
- Add curl-installer fallback with `YesFlag`/`IsTTY`
  gate to `installOllama()`
- Fix `genericInstallCmd("replicator")` bug
- Update documentation to show dnf alongside brew

### Non-Goals
- apt/Debian support (deferred)
- COPR repository setup
- Standalone installer script
- DevPod curl installer (does not exist — 404)
- New injectable fields on Options (reuse existing
  `YesFlag`/`IsTTY` pattern)
- Changes to Gaze/Replicator/Dewey/GH CLI install
  functions (already handled by prior changes)
- Changes to RPM packaging (already handled)

## Decisions

### D1: Reuse YesFlag/IsTTY for Ollama Curl Gate

The Ollama curl installer fallback uses the existing
`YesFlag bool` + `IsTTY func() bool` guard pattern on
`setup.Options`, matching `installOpenCode()` (line
552) and `installUV()` (line 782):

```go
if !opts.YesFlag && !opts.IsTTY() {
    return stepResult{..., action: "skipped",
        detail: "curl|bash install requires --yes flag or interactive terminal"}
}
```

**Rationale**: This pattern is established in the
codebase for exactly this purpose. Adding a new
`PromptUser` injectable would create a competing
abstraction. `YesFlag` means "auto-confirm" (proceed
without prompting). Non-TTY without `--yes` means
"skip" (CI safety).

### D2: Podman dnf Install — Direct Package Name

Podman is in Fedora's base repos. Use
`dnf install -y podman` directly (not `installViaRpm`
with a GitHub Release URL). This is simpler and
handles version management through the distro's
package lifecycle.

The auto-mode cascade for Podman uses `resolveMethod`
following the `installGH()` pattern:

```go
method := opts.resolveMethod("podman", env, "homebrew", "dnf")
switch method {
case "homebrew": // brew install podman
case "dnf":      // dnf install -y podman
default:         // skip with download link
}
```

No `go install` fallback — Podman is not a Go CLI
tool distributable via `go install`.

### D3: Ollama Curl Installer

Ollama provides an official install script at
`https://ollama.com/install.sh`. This is the documented
installation method for Linux. The YesFlag/IsTTY gate
(D1) controls whether this script runs.

The auto-mode cascade for Ollama:
1. Homebrew if detected
2. `YesFlag`/`IsTTY` gate, then
   `bash -c "curl -fsSL https://ollama.com/install.sh | sh"`
3. Skip with download link

Implementation: use `opts.ExecCmd("bash", "-c",
"curl -fsSL https://ollama.com/install.sh | sh")`,
matching the `installOpenCode()` pattern (line 560).

**Supply chain trade-off**: Constitution V requires
content-hash verification for downloads outside a
package manager. The Ollama install script content
changes with each release, making hash pinning
impractical. Mitigations: HTTPS transport, official
domain, user-confirmation gate, non-interactive skip.
This trade-off is documented in the proposal's
Constitution Alignment section.

### D4: DevPod — Binary Download Fallback

DevPod does NOT provide a `curl | sh` installer
(`https://devpod.sh/install.sh` returns HTTP 404).
However, DevPod provides a CLI binary download with
an explicit install command for Linux:

```bash
curl -L -o devpod "https://github.com/loft-sh/devpod/releases/latest/download/devpod-linux-amd64" \
  && sudo install -c -m 0755 devpod /usr/local/bin \
  && rm -f devpod
```

This downloads a known binary (not an opaque script),
which is better from a supply chain perspective than
`curl | sh`. The pattern is: download binary to a temp
path, then use `install` to place it with correct
permissions.

The auto-mode cascade for DevPod becomes:
1. Homebrew if detected
2. `YesFlag`/`IsTTY` gate, then binary download via
   curl + install
3. Skip with download link

Use the same `YesFlag`/`IsTTY` guard as Ollama since
this still runs curl and sudo. Architecture detection
uses `runtime.GOARCH` (mapped via `rpmArch()` which
returns `amd64` or `arm64`).

### D5: dnfInstallCmd Helper for Doctor Hints

Add a `dnfInstallCmd(toolName string) string` function
parallel to `homebrewInstallCmd()`. This function MUST
only return actual `dnf` commands for tools that are
installable via dnf:

| Tool | Command |
|------|---------|
| `go` | `dnf install -y golang` |
| `node` | `dnf install -y nodejs` |
| `gh` | `dnf install -y gh` |
| `podman` | `dnf install -y podman` |
| `gaze` | `sudo dnf install <RPM URL>` |
| `replicator` | `sudo dnf install <RPM URL>` |
| (default) | `dnf install -y <toolName>` |

For tools NOT in Fedora repos and without RPMs (ollama,
devpod, dewey), `dnfInstallCmd` returns empty string
and `managerInstallCmd` falls through to
`genericInstallCmd()`.

Wire this into `managerInstallCmd()` under
`case ManagerDnf:`.

### D6: resolveMethod Reuse

The `resolveMethod()` helper added by
`setup-auto-native-fallback` handles per-tool method
overrides and global `PackageManager` preference.
Reuse it in `installPodman()` with fallbacks
`"homebrew", "dnf"`, following the `installGH()`
pattern.

Do NOT route `installOllama()` through `resolveMethod`
— the curl installer is gated by `YesFlag`/`IsTTY`,
not by package manager detection. Use the
`installOpenCode()` pattern instead.

### D7: Documentation Scope

Update brew-only references in:
- `internal/doctor/environ.go` (bug fixes)
- `README.md` (add Fedora section)
- `QUICKSTART.md` (add Linux-native path)
- `CHANGELOG.md` (change entry)
- Embedded assets and deployed agent/command files

## Risks / Trade-offs

### R1: Curl|sh Supply Chain Risk

Running `curl | sh` from Ollama introduces a supply
chain risk. Mitigated by the `YesFlag`/`IsTTY` gate:
non-interactive mode (CI without `--yes`) skips the
installer entirely. `--yes` flag means the user has
explicitly opted in to automated installation.
Same pattern as `installOpenCode()` and `installUV()`.

### R2: dnf Requires Root/Sudo

`dnf install -y` requires root privileges. If the
user is not root, the command will fail. The
`stepResult` reports the failure with an actionable
message including guidance to run with elevated
privileges. This is consistent with how
`installViaRpm()` already behaves.

### R3: Podman Version Differences

Fedora repos may have a different Podman version than
Homebrew. The minimum version requirement (>= 4.3) is
checked by `uf doctor`, not by setup. This is
acceptable because doctor runs after setup.

### R4: Ollama Install Script Requires Sudo

The Ollama install script internally uses `sudo` to
install the binary and set up a systemd service.
When run via `ExecCmd`, the script's internal sudo
prompts may not reach the user's terminal. This
matches the existing behavior of `installOpenCode()`
which runs `curl | bash` via `ExecCmd`. If sudo
fails, the script returns a non-zero exit code which
is captured as a `"failed"` result.
