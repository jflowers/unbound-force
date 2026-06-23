## Why

On Fedora/RHEL without Homebrew, `uf setup` fails to install
7 of 11 tools. Each either skips with an unhelpful download
link or — worse — prints a `brew install` hint on a system
where brew is not present. The infrastructure for native
Linux installation partially exists (`installViaRpm()`,
`ManagerDnf` detection, `toolMethod()` dispatch) but is
not wired into the auto-mode fallback for most tools.

Four bugs compound the problem:

1. `genericInstallCmd("replicator")` returns a `brew install`
   command even in the "no package manager" codepath.
2. `managerInstallCmd()` has no `case ManagerDnf:` — dnf
   detection falls through to Homebrew hints.
3. `installHint()` detects dnf but dispatches to brew hints
   because `managerInstallCmd` has no dnf case.
4. Only `installGaze()` has `toolMethod()` dispatch — the
   other install functions skip it entirely.

The `setup-auto-native-fallback` change (issue #214) added
`resolveMethod()`, `installViaGo()`, and dnf/go-install
fallbacks for Gaze, Replicator, Dewey, and GH CLI. But
two tools remain broken on Linux without brew: Podman and
Ollama. DevPod has no automated Linux installer (no curl
script, no Fedora package). And the doctor hint bugs (#2
and #3 above) were not addressed by that change.

Fixes: https://github.com/unbound-force/unbound-force/issues/268

## What Changes

1. Fix `genericInstallCmd("replicator")` to return a GitHub
   releases download link instead of `brew install`.

2. Add `case ManagerDnf:` to `managerInstallCmd()` with
   dnf-appropriate install hints for tools available in
   Fedora repos (`gh`, `podman`, `nodejs`, `golang`) and
   GitHub Release RPM URLs for UF tools.

3. Add dnf fallback to `installPodman()`: when Homebrew is
   absent and dnf is detected, run `dnf install -y podman`.

4. Add curl-installer fallback to `installOllama()`: when
   Homebrew is absent, use the existing `YesFlag`/`IsTTY`
   guard pattern to confirm before running the official
   Ollama install script.

5. Add binary-download fallback to `installDevPod()`:
   DevPod has no `curl | sh` script, but provides a
   direct CLI binary download for Linux. Use the
   `YesFlag`/`IsTTY` guard pattern before downloading
   and installing the binary.

6. Update documentation and embedded scaffold assets to
   show dnf install commands alongside brew commands
   for Linux users.

## Capabilities

### New Capabilities
- `dnf-install-hints`: Doctor hints show `dnf install`
  commands on Fedora/RHEL systems instead of brew
  commands for tools in Fedora repos.
- `install-podman-dnf`: `installPodman()` falls back to
  `dnf install -y podman` when brew is absent and dnf
  is detected.
- `install-ollama-curl`: `installOllama()` falls back to
  the official Ollama curl installer with `YesFlag`/
  `IsTTY` confirmation gate when brew is absent.
- `install-devpod-binary`: `installDevPod()` falls back
  to downloading the DevPod CLI binary from GitHub
  Releases with `YesFlag`/`IsTTY` confirmation gate.

### Modified Capabilities
- `generic-install-cmd`: Fixed replicator entry to return
  GitHub releases link instead of brew command.
- `manager-install-cmd`: Added ManagerDnf case with
  tool-specific dnf commands.
- `install-podman`: Gains dnf fallback in auto mode.
- `install-ollama`: Gains curl-installer fallback in
  auto mode using existing `YesFlag`/`IsTTY` pattern.
- `install-devpod`: Gains binary-download fallback in
  auto mode using `YesFlag`/`IsTTY` gate.

### Removed Capabilities
- None.

## Impact

- `internal/doctor/environ.go`: Modified — add dnf case
  to `managerInstallCmd()`, fix `genericInstallCmd`.
- `internal/setup/setup.go`: Modified — update
  `installPodman()` and `installOllama()`.
- `internal/setup/setup_test.go`: Modified — new tests
  for dnf and curl fallback paths.
- `internal/doctor/environ_test.go`: Modified — tests for
  dnf hint dispatch.
- Documentation files: Updated brew-only references with
  dnf alternatives.
- No cross-repo impact (RPMs for gaze, dewey, replicator
  are already produced per `setup-auto-native-fallback`
  and `linux-cross-platform-install` changes).

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change does not affect inter-hero artifact formats,
communication protocols, or metadata. It modifies only
the tool installation mechanism within `uf setup` and
doctor hint generation.

### II. Composability First

**Assessment**: PASS

This change directly supports Composability First by
removing platform barriers. Podman and Ollama become
installable on Linux without requiring Homebrew. Each
fallback tier is optional and degrades gracefully:
dnf -> curl installer (with user confirmation) -> skip
with download link. No mandatory dependencies are
introduced.

### III. Observable Quality

**Assessment**: N/A

This change does not affect output formats, provenance
metadata, or machine-parseable output. The `stepResult`
struct already reports the install method in `detail`,
which will now report "via dnf" or "via curl installer"
alongside existing methods.

### IV. Testability

**Assessment**: PASS

All new code uses the existing injectable dependency
pattern (`LookPath`, `ExecCmd`, `YesFlag`, `IsTTY` on
the Options struct). No new injectable fields are added.
No tests require network access, external services, or
shared mutable state.

### V. Security by Default

**Assessment**: PASS WITH TRADE-OFF

This change introduces `curl -fsSL https://ollama.com/install.sh | sh`
execution for Ollama installation. Constitution V
requires: "Dependencies MUST be verified by content
hash (SHA256 or equivalent) when downloaded outside a
package manager's built-in verification."

The curl|sh pattern cannot satisfy strict hash
verification because the Ollama install script content
changes with each release — there is no stable hash to
pin against. This is a documented trade-off:

**Mitigations in place**:
- HTTPS transport (TLS verification)
- Script is from the tool's official domain
  (ollama.com)
- User must explicitly confirm via `--yes` flag or
  interactive TTY prompt — non-interactive mode
  (CI without `--yes`) skips the installer entirely
- Same pattern already used by `installOpenCode()` and
  `installUV()` in the existing codebase

**Justification**: Hash pinning is impractical for
third-party install scripts that change with each
release. The user-confirmation gate ensures no
unattended execution of unverified scripts. This
matches the precedent set by OpenCode and uv
installers.

This trade-off is accepted per the constitution's
Conflict Resolution clause.
