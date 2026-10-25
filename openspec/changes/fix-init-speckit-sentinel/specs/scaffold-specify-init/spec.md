## ADDED Requirements

None.

## MODIFIED Requirements

### Requirement: FR-SPECIFY-INIT — Specify CLI invocation

`uf init` MUST invoke specify as
`specify init --here --integration opencode --offline --force`
when the `.specify/scripts` sentinel does not exist and the
`specify` binary is found in PATH. The `--force` flag MUST
come from the base delegation args unconditionally (FR-018);
the conditional forceFlag append MUST NOT add a second
`--force` on either the fresh-init or the re-init path.

Previously: `uf init` invoked specify as
`specify init --here --integration opencode --offline` when
the bare `.specify` sentinel did not exist
(fix-specify-init-invocation). The bare-directory sentinel
let UF's embedded constitution asset suppress the delegation
on every fresh run, and the invocation lacked the `--force`
merge flag the always-non-empty target directory requires.

#### Scenario: Successful specify initialization

- **GIVEN** the `specify` binary is in PATH
- **AND** the `.specify/scripts` sentinel does not exist in
  the target directory
- **WHEN** `uf init` runs the specify sub-tool
  initialization
- **THEN** the command executed MUST be
  `specify init --here --integration opencode --offline --force`
- **AND** the result MUST include a subToolResult with name
  `.specify/` and action `initialized`

#### Scenario: Specify already installed

- **GIVEN** `.specify/scripts` exists in the target
  directory
- **WHEN** `uf init` runs without `--force`
- **THEN** specify initialization MUST be skipped
- **AND** no `specify` command MUST be executed
- **AND** the summary MUST report `.specify/` as
  "already configured" (FR-019)

#### Scenario: Partial specify directory does not satisfy the sentinel

- **GIVEN** `.specify/` exists in the target directory but
  `.specify/scripts` does not (e.g. only
  `.specify/memory/constitution.md` from the asset walk)
- **WHEN** `uf init` runs the specify sub-tool
  initialization
- **THEN** the delegation MUST proceed with the merge
  invocation above

#### Scenario: Specify binary not found

- **GIVEN** the `specify` binary is NOT in PATH
- **WHEN** `uf init` evaluates the specify sub-tool
- **THEN** specify initialization MUST be skipped silently
  (no result reported)

#### Scenario: Specify init fails

- **GIVEN** the `specify` binary is in PATH
- **AND** the `.specify/scripts` sentinel does not exist
- **WHEN** `specify init --here --integration opencode
  --offline --force` exits with a non-zero status
- **THEN** the result MUST include a subToolResult with
  name `.specify/` and action `failed`
- **AND** the detail MUST include the error message from
  the specify command

## REMOVED Requirements

None.

<!-- scaffolded by uf vdev -->
