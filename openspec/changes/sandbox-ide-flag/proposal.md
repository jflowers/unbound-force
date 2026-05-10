## Why

The DevPod sandbox backend hardcodes `--ide none` in both
`Create()` and `Start()`, preventing users from using VS Code,
Cursor, or other IDEs alongside the OpenCode TUI. DevPod
natively supports multiple IDEs via its `--ide` flag, and
the OpenCode TUI continues to work regardless of which IDE
is selected because it runs as a server inside the container
on port 4096 — the IDE choice only controls what DevPod
launches *after* the container is healthy.

Users who want to browse code visually in VS Code while using
the OpenCode TUI for AI-assisted coding currently have no way
to do this through `uf sandbox`.

## What Changes

Add an `--ide` flag to `uf sandbox create` and
`uf sandbox start` that passes through to `devpod up`.
Default remains `none` for backward compatibility.

## Capabilities

### New Capabilities

- `sandbox create --ide vscode`: Creates a DevPod workspace
  and opens VS Code connected to it. OpenCode TUI remains
  accessible via `uf sandbox attach`.
- `sandbox start --ide vscode`: Resumes a DevPod workspace
  and opens VS Code. Works alongside `--detach`.
- `IDE` field on `Options` struct: Configurable via CLI flag,
  environment variable (`UF_SANDBOX_IDE`), or
  `.uf/sandbox.yaml` (`ide` field).

### Modified Capabilities

- `DevPodBackend.Create()`: Uses `opts.IDE` instead of
  hardcoded `"none"` for the `--ide` argument. Waits for
  OpenCode server health check after creation. Suppresses
  DevPod tunnel errors when workspace creation succeeds.
- `DevPodBackend.Start()`: Passes `--ide` to `devpod up`
  when resuming a workspace. Waits for OpenCode server
  health check before TUI attach. Falls back to starting
  the server via SSH when `postStartCommand` didn't run
  (workspaces created before template update).
- `Attach()`: Now detects persistent workspaces (DevPod
  and Podman named volumes) before falling back to
  ephemeral container check.
- `Destroy()`: Now handles ephemeral mode directly
  instead of incorrectly routing through
  `ResolveBackend()`. Confirmation prompt now provides
  feedback on empty input instead of silently exiting.

### Removed Capabilities

- None.

## Impact

- **`internal/sandbox/sandbox.go`**: Add `IDE string` field
  to `Options` struct. Fix `Attach()` to detect persistent
  workspaces. Fix `Destroy()` to handle ephemeral mode.
- **`internal/sandbox/devpod.go`**: Replace hardcoded
  `"none"` with `opts.IDE` in `Create()` and `Start()`.
  Add `waitForHealth()` call in `Start()`.
- **`internal/sandbox/config.go`**: Add `IDE` to
  `DefaultConfig()` resolution (flag > env > config > "none").
- **`internal/sandbox/workspace.go`**: Add `ide` field to
  `SandboxConfig` YAML struct.
- **`internal/scaffold/assets/devcontainer/devcontainer.json`**:
  Add `postStartCommand` to auto-start OpenCode server.
- **`internal/sandbox/sandbox_test.go`**: Tests for IDE
  passthrough, Attach persistent detection, Destroy
  ephemeral handling.
- **CLI wiring**: Add `--ide` flag to `create` and `start`
  cobra commands.
- **`cmd/unbound-force/sandbox.go`**: Fix destroy
  confirmation empty-input handling.

## Bugs Found During Manual Testing

Four bugs discovered during hands-on testing:

1. **DevPod Create missing health check**: `Create()`
   returned immediately after `devpod up` without
   waiting for the OpenCode server, unlike `Start()`.
2. **DevPod Bun tunnel error shown to user**: DevPod
   v0.6.x has a Bun runtime bug where the VS Code
   tunnel crashes after successful workspace creation,
   producing a raw `fetch()` stack trace. The workspace
   works fine but the error is alarming.
3. **postStartCommand not retroactive**: DevPod
   snapshots devcontainer.json at creation time, so
   workspaces created before the template update never
   get the OpenCode server auto-start. `Start()` needs
   an SSH fallback to start the server manually.
4. **Destroy confirmation silently exits**: Pressing
   Enter without typing at the `[y/N]` prompt causes
   `fmt.Fscanln` to error, and the error path returns
   `nil` without printing "Cancelled."

Additionally, a DevPod upstream bug will be filed:
DevPod's VS Code tunnel uses Bun internally and crashes
with `The socket connection was closed unexpectedly`
during IDE connector setup.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change adds a CLI flag passthrough. It does not
affect inter-hero artifact communication.

### II. Composability First

**Assessment**: PASS

The IDE flag is optional with a backward-compatible
default (`none`). VS Code and the OpenCode TUI work
independently and simultaneously — neither requires
the other. Users who don't want IDE integration are
unaffected.

### III. Observable Quality

**Assessment**: N/A

No new output formats or quality claims introduced.

### IV. Testability

**Assessment**: PASS

The `IDE` field is added to the existing `Options`
struct and injected via the standard DI pattern. Tests
verify the flag is passed through to `devpod up`
arguments via the existing `ExecCmd` injection.
