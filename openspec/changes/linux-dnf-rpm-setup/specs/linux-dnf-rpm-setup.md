## ADDED Requirements

### Requirement: FR-DNF-001 — dnf Install Hints

The doctor MUST return dnf-appropriate install hints
when `ManagerDnf` is detected and the tool is available
in Fedora repos or has a known RPM on GitHub Releases.

The `managerInstallCmd()` function MUST include a
`case ManagerDnf:` that dispatches to a
`dnfInstallCmd()` helper. The helper MUST only return
actual dnf commands for tools available via dnf. For
tools not in Fedora repos (ollama, devpod, dewey),
the function MUST fall through to `genericInstallCmd()`
which returns download links or alternative install
methods.

#### Scenario: Fedora system with dnf, no Homebrew

- **GIVEN** the detected environment has `ManagerDnf`
  and does not have `ManagerHomebrew`
- **WHEN** `installHint("podman", env)` is called
- **THEN** the returned string is `dnf install -y podman`

#### Scenario: dnf hint for UF tool with RPM

- **GIVEN** the detected environment has `ManagerDnf`
- **WHEN** `installHint("gaze", env)` is called
- **THEN** the returned string contains
  `dnf install` and a GitHub Release RPM URL

#### Scenario: Both managers detected, Homebrew preferred

- **GIVEN** the detected environment has both
  `ManagerHomebrew` and `ManagerDnf`
- **WHEN** `installHint("podman", env)` is called
- **THEN** the returned string is `brew install podman`
  (Homebrew takes priority in the manager iteration)

### Requirement: FR-DNF-002 — Podman dnf Fallback

`installPodman()` MUST attempt `dnf install -y podman`
when Homebrew is absent and `ManagerDnf` is detected,
before skipping with a download link. The function
MUST use `resolveMethod("podman", env, "homebrew",
"dnf")` for method dispatch, following the existing
pattern in `installGH()`.

#### Scenario: Podman install via dnf

- **GIVEN** Podman is not in PATH, Homebrew is absent,
  and `ManagerDnf` is detected
- **WHEN** `installPodman()` runs in auto mode
- **THEN** it calls `dnf install -y podman`
- **AND** returns `action: "installed"`,
  `detail: "via dnf"`

#### Scenario: Podman dnf install fails

- **GIVEN** Podman is not in PATH, Homebrew is absent,
  and `ManagerDnf` is detected
- **WHEN** `installPodman()` runs and `dnf install`
  fails
- **THEN** it returns `action: "failed"` with an
  actionable error message

#### Scenario: Podman dnf fails — permission denied

- **GIVEN** non-root user, `ManagerDnf` is detected,
  Homebrew is absent
- **WHEN** `installPodman()` runs and `dnf install`
  fails with a permission error
- **THEN** the error detail includes guidance:
  "dnf install requires root — run with sudo or
  install manually: sudo dnf install -y podman"

#### Scenario: Explicit PackageManager override

- **GIVEN** `PackageManager` is set to `"dnf"` and
  Homebrew is available
- **WHEN** `installPodman()` runs
- **THEN** it uses dnf, not Homebrew

#### Scenario: Both managers available, auto mode

- **GIVEN** both Homebrew and `ManagerDnf` are detected
- **WHEN** `installPodman()` runs in auto mode
- **THEN** it uses Homebrew (first in fallback chain)

### Requirement: FR-DNF-003 — Ollama Curl Installer

`installOllama()` MUST offer the official Ollama curl
installer as a fallback when Homebrew is absent. The
function MUST use the existing `YesFlag`/`IsTTY` guard
pattern (matching `installOpenCode()` and `installUV()`)
to gate execution of the third-party script.

#### Scenario: Ollama curl install with --yes flag

- **GIVEN** Ollama is not in PATH, Homebrew is absent,
  and `YesFlag` is true
- **WHEN** `installOllama()` runs in auto mode
- **THEN** it executes
  `bash -c "curl -fsSL https://ollama.com/install.sh | sh"`
  without prompting
- **AND** returns `action: "installed"`,
  `detail: "via curl installer"`

#### Scenario: Ollama curl install with interactive TTY

- **GIVEN** Ollama is not in PATH, Homebrew is absent,
  `YesFlag` is false, and `IsTTY()` returns true
- **WHEN** `installOllama()` runs in auto mode
- **THEN** it executes the curl installer
- **AND** returns `action: "installed"`,
  `detail: "via curl installer"`

#### Scenario: Ollama skipped — non-interactive

- **GIVEN** Ollama is not in PATH, Homebrew is absent,
  `YesFlag` is false, and `IsTTY()` returns false
- **WHEN** `installOllama()` runs
- **THEN** it returns `action: "skipped"`,
  `detail` containing "curl|bash install requires
  --yes flag or interactive terminal"

#### Scenario: Ollama curl install fails

- **GIVEN** Ollama is not in PATH, Homebrew is absent,
  `YesFlag` is true
- **WHEN** `installOllama()` runs and the curl command
  fails (network error, script error)
- **THEN** it returns `action: "failed"`,
  `detail: "curl install failed"` with the error

### Requirement: FR-DNF-004 — DevPod Binary Download

DevPod does NOT have a `curl | sh` installer script.
Instead, DevPod provides a CLI binary download for
Linux. `installDevPod()` MUST offer the binary download
as a fallback when Homebrew is absent. The function
MUST use the existing `YesFlag`/`IsTTY` guard pattern
to gate execution since it runs curl and sudo.

The binary download command is architecture-aware:
`https://github.com/loft-sh/devpod/releases/latest/download/devpod-linux-{amd64|arm64}`

#### Scenario: DevPod binary download with --yes

- **GIVEN** DevPod is not in PATH, Homebrew is absent,
  and `YesFlag` is true
- **WHEN** `installDevPod()` runs in auto mode
- **THEN** it downloads the DevPod binary via curl,
  installs it to `/usr/local/bin` with mode 0755,
  and returns `action: "installed"`,
  `detail: "via binary download"`

#### Scenario: DevPod binary download with TTY

- **GIVEN** DevPod is not in PATH, Homebrew is absent,
  `YesFlag` is false, and `IsTTY()` returns true
- **WHEN** `installDevPod()` runs in auto mode
- **THEN** it downloads and installs the DevPod binary

#### Scenario: DevPod skipped — non-interactive

- **GIVEN** DevPod is not in PATH, Homebrew is absent,
  `YesFlag` is false, and `IsTTY()` returns false
- **WHEN** `installDevPod()` runs
- **THEN** it returns `action: "skipped"`,
  `detail` containing "curl|bash install requires
  --yes flag or interactive terminal"

#### Scenario: DevPod download fails

- **GIVEN** DevPod is not in PATH, Homebrew is absent,
  `YesFlag` is true
- **WHEN** the curl download command fails
- **THEN** it returns `action: "failed"`,
  `detail: "binary download failed"` with the error

## MODIFIED Requirements

### Requirement: genericInstallCmd replicator fix

`genericInstallCmd("replicator")` MUST return
`"Download from https://github.com/unbound-force/replicator/releases"`
instead of `"brew install unbound-force/tap/replicator"`.

Previously: returned a Homebrew command even in the
"no package manager detected" codepath.

### Requirement: managerInstallCmd dnf case

`managerInstallCmd()` MUST include a `case ManagerDnf:`
that returns dnf-appropriate commands for tools in
Fedora repos and falls through to `genericInstallCmd()`
for tools not in Fedora repos (ollama, devpod, dewey).

Previously: no ManagerDnf case existed; dnf detection
fell through to `homebrewInstallCmd()` as the default
return.

## REMOVED Requirements

None.
