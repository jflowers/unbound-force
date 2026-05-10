## ADDED Requirements

### Requirement: IDE flag on sandbox create

`uf sandbox create` MUST accept an `--ide` flag that
specifies which IDE DevPod opens after provisioning
the workspace. The flag MUST be passed through to
`devpod up` as the `--ide` argument. Default: `"none"`.

#### Scenario: Create with VS Code

- **GIVEN** the user runs `uf sandbox create --backend devpod --ide vscode`
- **WHEN** the workspace is provisioned
- **THEN** `devpod up` is called with `--ide vscode`

Note: VS Code opening and the OpenCode server on port
4096 are expected DevPod behaviors, verified manually.
Unit tests verify only the argument passthrough.

#### Scenario: Create with default (no IDE flag)

- **GIVEN** the user runs `uf sandbox create --backend devpod`
- **AND** no `--ide` flag is provided
- **WHEN** the workspace is provisioned
- **THEN** `devpod up` is called with `--ide none`

#### Scenario: Create with invalid IDE value

- **GIVEN** the user runs `uf sandbox create --ide invalid`
- **WHEN** the command validates the IDE value
- **THEN** the command reports an error listing valid
  IDE values
- **AND** `devpod up` is not called

### Requirement: IDE flag on sandbox start

`uf sandbox start` MUST accept an `--ide` flag when
resuming a DevPod workspace. The flag MUST be passed
through to `devpod up --id <name> --ide <value>`.

#### Scenario: Resume with VS Code

- **GIVEN** a DevPod workspace exists
- **AND** the user runs `uf sandbox start --ide vscode`
- **WHEN** the workspace is resumed
- **THEN** `devpod up` is called with `--ide vscode`

#### Scenario: Resume with default

- **GIVEN** a DevPod workspace exists
- **AND** the user runs `uf sandbox start`
- **WHEN** the workspace is resumed
- **THEN** `devpod up` is called with `--ide none`

### Requirement: IDE value validation

The IDE value MUST be validated against DevPod's
supported IDE list: `none`, `vscode`, `openvscode`,
`fleet`, `jupyternotebook`, `cursor`. Invalid values
MUST produce an error before invoking `devpod up`.

#### Scenario: Valid IDE values accepted

- **GIVEN** the IDE value is one of: none, vscode,
  openvscode, fleet, jupyternotebook, cursor
- **WHEN** validation runs
- **THEN** the value is accepted

#### Scenario: Invalid IDE value rejected

- **GIVEN** the IDE value is "sublime"
- **WHEN** validation runs
- **THEN** an error is returned containing all valid
  IDE names (none, vscode, openvscode, fleet,
  jupyternotebook, cursor)

### Requirement: IDE resolution chain

The IDE value MUST be resolved from multiple sources
in priority order: `--ide` CLI flag > `UF_SANDBOX_IDE`
environment variable > `.uf/sandbox.yaml` `ide` field
> default `"none"`.

#### Scenario: CLI flag overrides env var

- **GIVEN** `UF_SANDBOX_IDE=fleet`
- **AND** the user passes `--ide vscode`
- **WHEN** the IDE value is resolved
- **THEN** the resolved value is `vscode`

#### Scenario: Env var used when no flag

- **GIVEN** `UF_SANDBOX_IDE=cursor`
- **AND** no `--ide` flag is provided
- **WHEN** the IDE value is resolved
- **THEN** the resolved value is `cursor`

#### Scenario: Config file used as fallback

- **GIVEN** `.uf/sandbox.yaml` contains `ide: vscode`
- **AND** no flag or env var is set
- **WHEN** the IDE value is resolved
- **THEN** the resolved value is `vscode`

### Requirement: IDE flag ignored for ephemeral sandbox

The `--ide` flag MUST only affect the DevPod backend.
When the sandbox runs in ephemeral Podman mode (no
`uf sandbox create`), the IDE flag MUST be silently
ignored.

#### Scenario: Ephemeral mode ignores IDE flag

- **GIVEN** no persistent workspace exists
- **AND** the user runs `uf sandbox start --ide vscode`
- **WHEN** the sandbox starts in ephemeral mode
- **THEN** the `--ide` flag is ignored
- **AND** the ephemeral Podman container starts normally

### Requirement: Attach detects persistent workspaces

`Attach()` MUST check for persistent workspaces (Podman
named volume or DevPod workspace) before falling back to
the ephemeral container check. When a persistent
workspace exists, `Attach()` MUST delegate to the
resolved backend's `Attach()` method.

#### Scenario: Attach to DevPod workspace

- **GIVEN** a DevPod workspace exists and is running
- **AND** the user runs `uf sandbox attach`
- **WHEN** Attach checks for workspaces
- **THEN** it detects the DevPod workspace
- **AND** delegates to `DevPodBackend.Attach()`

#### Scenario: Attach with no workspace

- **GIVEN** no persistent workspace exists
- **AND** no ephemeral container is running
- **WHEN** the user runs `uf sandbox attach`
- **THEN** the command reports "no sandbox running"

### Requirement: DevPod Start waits for health

`DevPodBackend.Start()` MUST wait for the OpenCode
server health check (`waitForHealth`) after `devpod up`
returns and before attempting TUI attach. If the health
check times out, the command MUST print a warning and
return without error (the IDE may still be connected).

#### Scenario: Health check passes

- **GIVEN** the DevPod workspace is resumed
- **AND** the OpenCode server starts within the timeout
- **WHEN** `DevPodBackend.Start()` runs
- **THEN** `waitForHealth` succeeds
- **AND** the TUI attaches normally

#### Scenario: Health check times out

- **GIVEN** the DevPod workspace is resumed
- **AND** the OpenCode server does not respond
- **WHEN** `DevPodBackend.Start()` runs
- **THEN** a warning is printed suggesting
  `uf sandbox attach`
- **AND** the command returns without error

### Requirement: Devcontainer auto-starts OpenCode server

The devcontainer.json template MUST include a
`postStartCommand` that starts the OpenCode server
in the background. This ensures the server is running
when DevPod overrides the container entrypoint with
its own agent process.

#### Scenario: Server starts via postStartCommand

- **GIVEN** a DevPod workspace starts from the template
- **WHEN** DevPod runs the postStartCommand
- **THEN** the OpenCode server starts on port 4096
- **AND** the health check endpoint responds

### Requirement: Destroy handles ephemeral mode

`Destroy()` MUST check for persistent workspaces before
delegating to `ResolveBackend()`. When no persistent
workspace exists, `Destroy()` MUST handle ephemeral
cleanup directly (stop and remove the container) or
report that there is nothing to destroy. This prevents
`ResolveBackend()` from incorrectly selecting the
DevPod backend for ephemeral containers.

#### Scenario: Destroy ephemeral container

- **GIVEN** an ephemeral container is running
- **AND** no persistent workspace exists
- **WHEN** the user runs `uf sandbox destroy`
- **THEN** the container is stopped and removed
- **AND** `ResolveBackend()` is NOT called

#### Scenario: Destroy with no workspace

- **GIVEN** no persistent workspace exists
- **AND** no ephemeral container is running
- **WHEN** the user runs `uf sandbox destroy`
- **THEN** the command reports "No sandbox to destroy"
- **AND** returns without error

#### Scenario: Destroy persistent workspace

- **GIVEN** a persistent DevPod workspace exists
- **WHEN** the user runs `uf sandbox destroy`
- **THEN** `Destroy()` delegates to the resolved
  backend's `Destroy()` method

### Requirement: DevPod Create waits for health

`DevPodBackend.Create()` MUST call `waitForHealth()`
after `devpod up` returns, matching the pattern in
`DevPodBackend.Start()`. Without this, the OpenCode
server may not be ready when the user tries to attach
immediately after workspace creation.

#### Scenario: Health check after create

- **GIVEN** the user runs `uf sandbox create --backend devpod`
- **WHEN** `devpod up` completes successfully
- **THEN** `waitForHealth()` is called before returning
- **AND** if the health check times out, a warning is
  printed and the command returns without error

### Requirement: DevPod Create suppresses tunnel errors

When `devpod up` returns a non-zero exit code but the
workspace was created successfully (verified via
`devpod status`), `DevPodBackend.Create()` MUST
suppress the raw DevPod stderr output and print a
friendlier message. This handles the known DevPod Bun
runtime bug where the IDE tunnel crashes after
workspace creation.

#### Scenario: Tunnel error after successful creation

- **GIVEN** the user runs `uf sandbox create --backend devpod --ide vscode`
- **AND** `devpod up` returns non-zero due to a tunnel
  error
- **WHEN** `devpod status` confirms the workspace is
  Running
- **THEN** a user-friendly warning is printed instead
  of the raw Bun `fetch()` stack trace
- **AND** the command returns without error

#### Scenario: Real creation failure

- **GIVEN** the user runs `uf sandbox create --backend devpod`
- **AND** `devpod up` returns non-zero
- **WHEN** `devpod status` confirms the workspace does
  NOT exist or is not Running
- **THEN** the full error output is reported to the user
- **AND** the command returns an error

#### Scenario: Status check fails after creation error

- **GIVEN** `devpod up` returns non-zero
- **AND** `devpod status` also returns an error
- **WHEN** Create() handles the failure
- **THEN** the original `devpod up` error is reported
- **AND** the command returns an error

### Requirement: Start falls back to SSH server start

When `waitForHealth()` times out in
`DevPodBackend.Start()`, the command MUST attempt to
start the OpenCode server via
`devpod ssh <ws> -- nohup opencode serve ...` before
giving up. This handles workspaces created before the
`postStartCommand` was added to the devcontainer
template, and cases where `postStartCommand` failed.

#### Scenario: Server not running, SSH fallback starts it

- **GIVEN** a DevPod workspace is resumed
- **AND** `postStartCommand` did not run (workspace
  created before the template update)
- **WHEN** `waitForHealth()` times out
- **THEN** `DevPodBackend.Start()` runs
  `devpod ssh <ws> -- nohup opencode serve --port 4096`
- **AND** waits for the health check again
- **AND** attaches normally if the server starts

#### Scenario: SSH fallback also fails

- **GIVEN** a DevPod workspace is resumed
- **AND** the OpenCode binary is not available inside
  the container
- **WHEN** both `waitForHealth()` and the SSH fallback
  fail
- **THEN** a warning is printed with remediation steps
- **AND** the command returns without error

#### Scenario: Server already running when SSH fallback executes

- **GIVEN** a DevPod workspace is resumed
- **AND** the OpenCode server is already running on
  port 4096 (postStartCommand succeeded but health
  check timed out)
- **WHEN** the SSH fallback attempts to start the
  server
- **THEN** the port-in-use error is non-fatal
- **AND** the second `waitForHealth()` succeeds

### Requirement: Destroy confirmation provides feedback

The `uf sandbox destroy` confirmation prompt MUST
replace `fmt.Fscanln` with `bufio.Scanner` for
line-oriented input reading. The prompt MUST provide
feedback for all inputs. Any input that is not "y" or
"yes" (case-insensitive) — including empty Enter, "n",
EOF, bare `\r`, and piped input — MUST print
"Cancelled." and return without error.

#### Scenario: User presses Enter without typing

- **GIVEN** the user runs `uf sandbox destroy`
- **AND** the confirmation prompt `[y/N]` is shown
- **WHEN** the user presses Enter without typing
- **THEN** the command prints "Cancelled."
- **AND** returns without error

#### Scenario: User types "n" or "no"

- **GIVEN** the user runs `uf sandbox destroy`
- **WHEN** the user types "n" at the confirmation prompt
- **THEN** the command prints "Cancelled."
- **AND** returns without error

#### Scenario: EOF from piped input

- **GIVEN** stdin is a pipe that closes immediately
  (e.g., `echo "" | uf sandbox destroy`)
- **WHEN** the scanner reads EOF
- **THEN** the command prints "Cancelled."
- **AND** returns without error

## MODIFIED Requirements

### Requirement: Options struct

Previously: No IDE field on `Options`.
Now: `Options` MUST include an `IDE string` field.

### Requirement: DevPodBackend.Create arguments

Previously: `--ide none` hardcoded in `devpod up` args.
Now: Uses `opts.IDE` (resolved, validated, defaulting
to `"none"`).

### Requirement: DevPodBackend.Start arguments

Previously: No `--ide` argument on resume.
Now: Passes `--ide opts.IDE` to `devpod up --id`.
Additionally waits for OpenCode server health before
TUI attach.

### Requirement: Attach dispatch

Previously: Only checked ephemeral Podman container.
Now: Checks `isPersistentWorkspace()` first and
delegates to backend for persistent workspaces.

### Requirement: Destroy dispatch

Previously: Always called `ResolveBackend()` which
could incorrectly select DevPod for ephemeral
containers.
Now: Checks `isPersistentWorkspace()` first. Handles
ephemeral cleanup directly when no persistent
workspace exists.

## REMOVED Requirements

None.
