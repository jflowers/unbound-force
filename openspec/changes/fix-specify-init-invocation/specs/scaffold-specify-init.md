## ADDED Requirements

_None._

## MODIFIED Requirements

### Requirement: FR-SPECIFY-INIT — Specify CLI invocation

`uf init` MUST invoke specify as
`specify init --here --integration opencode --offline`
when the `.specify` sentinel does not exist and the
`specify` binary is found in PATH.

Previously: `uf init` invoked bare `specify init` with
no additional arguments (scaffold.go:1500-1501, nil
extraArgs).

#### Scenario: Successful specify initialization

- **GIVEN** the `specify` binary is in PATH
- **AND** the `.specify/` directory does not exist in
  the target directory
- **WHEN** `uf init` runs the specify sub-tool
  initialization
- **THEN** the command executed MUST be
  `specify init --here --integration opencode --offline`
- **AND** the result MUST include a subToolResult with
  name `.specify/` and action `initialized`

#### Scenario: Specify already initialized

- **GIVEN** the `.specify/` directory already exists in
  the target directory
- **WHEN** `uf init` evaluates the specify sub-tool
- **THEN** specify initialization MUST be skipped
- **AND** no `specify` command MUST be executed

#### Scenario: Specify binary not found

- **GIVEN** the `specify` binary is NOT in PATH
- **WHEN** `uf init` evaluates the specify sub-tool
- **THEN** specify initialization MUST be skipped
  silently (no error reported)

#### Scenario: Specify init fails

- **GIVEN** the `specify` binary is in PATH
- **AND** the `.specify/` directory does not exist
- **WHEN** `specify init --here --integration opencode --offline`
  exits with a non-zero status
- **THEN** the result MUST include a subToolResult with
  name `.specify/` and action `failed`
- **AND** the detail MUST include the error message from
  the specify command

### Requirement: FR-SPECIFY-NONINTERACTIVE — Non-interactive operation

`specify init` invoked by `uf init` MUST operate fully
non-interactively. The `--here` flag MUST be used to
avoid prompting for a project name. The `--integration`
flag MUST be used to avoid defaulting to `copilot` in
non-interactive sessions.

Previously: spec 027 line 307 asserted "specify init
is non-interactive" without flags. This was true of
older specify versions but is no longer accurate.

#### Scenario: Non-interactive execution

- **GIVEN** `uf init` runs without a TTY attached
- **WHEN** specify sub-tool initialization executes
- **THEN** `specify init` MUST NOT prompt for user input
- **AND** `specify init` MUST NOT default to the
  `copilot` integration
- **AND** the `opencode` integration MUST be selected
  explicitly via `--integration opencode`

#### Scenario: Integration flag is mandatory (regression guard)

- **GIVEN** the specify invocation arguments are
  constructed by `initSimpleTool`
- **WHEN** the argument list is inspected
- **THEN** `--integration opencode` MUST appear in the
  arguments
- **AND** a bare invocation without `--integration`
  MUST NOT be used (it defaults to `copilot` in
  non-interactive sessions, which was the root cause
  of #213)

### Requirement: FR-SPECIFY-OFFLINE — Offline initialization

`specify init` invoked by `uf init` MUST use the
`--offline` flag to force use of bundled assets from
the wheel's `core_pack/` directory.

Previously: No offline requirement existed. Older
specify versions downloaded templates from GitHub
Releases at runtime, which failed when releases had
no assets (#216).

#### Scenario: Offline initialization

- **GIVEN** the specify-cli package was installed from
  PyPI (bundled assets present)
- **WHEN** `specify init --here --integration opencode --offline`
  executes
- **THEN** initialization MUST succeed without network
  access
- **AND** `.specify/` MUST contain templates, scripts,
  and workflow files from the bundled core_pack

## REMOVED Requirements

_None._
