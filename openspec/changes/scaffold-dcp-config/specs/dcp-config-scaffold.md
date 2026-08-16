## ADDED Requirements

### FR-001: DCP Config Creation

The scaffold engine MUST create `.opencode/dcp.jsonc` during
`uf init` when the file does not exist.

#### Scenario: First-time init on a new project

- **GIVEN** a project directory with no `.opencode/dcp.jsonc`
- **WHEN** `uf init` runs
- **THEN** `.opencode/dcp.jsonc` is created with `$schema`,
  JSONC comments, and `compress.protectTags` set to `true`,
  and returns a `subToolResult` with name `dcp.jsonc` and
  action `created`

### FR-002: Idempotent Config Update

The scaffold engine MUST NOT overwrite `.opencode/dcp.jsonc`
when it exists and already contains `compress.protectTags: true`.

#### Scenario: Re-running init on a configured project

- **GIVEN** `.opencode/dcp.jsonc` exists with
  `compress.protectTags: true`
- **WHEN** `uf init` runs
- **THEN** the file is not modified and the result reports
  "skipped"

### FR-003: Additive protectTags Insertion

The scaffold engine MUST add `compress.protectTags: true`
to an existing `.opencode/dcp.jsonc` that lacks the key,
preserving existing configuration keys.

#### Scenario: Existing file without protectTags

- **GIVEN** `.opencode/dcp.jsonc` exists with `$schema` but
  no `compress.protectTags` key
- **WHEN** `uf init` runs
- **THEN** `compress.protectTags: true` is added to the file,
  existing keys are preserved, and the result reports "updated"

### FR-004: DryRun Compliance

The scaffold engine MUST NOT create or modify `.opencode/dcp.jsonc`
when `opts.DryRun` is true.

#### Scenario: Dry-run init

- **GIVEN** `opts.DryRun` is `true`
- **WHEN** `uf init --dry-run` runs
- **THEN** no file I/O occurs for `dcp.jsonc` and the result
  reports "dry-run"

### FR-005: Force Overwrite

The scaffold engine MUST overwrite `.opencode/dcp.jsonc`
entirely when `opts.Force` is true, regardless of existing
content.

#### Scenario: Force init on existing config

- **GIVEN** `.opencode/dcp.jsonc` exists with custom content
- **WHEN** `uf init --force` runs
- **THEN** the file is overwritten with `$schema`, JSONC
  comments, and `compress.protectTags` set to `true`

### FR-006: Error Handling

The scaffold engine MUST return an error result when
`.opencode/dcp.jsonc` exists but cannot be read or parsed.

#### Scenario: Unreadable config file

- **GIVEN** `.opencode/dcp.jsonc` exists but cannot be read
  (e.g., permission denied)
- **WHEN** `uf init` runs
- **THEN** the result reports an error with context and the
  file is not modified

#### Scenario: Malformed config file

- **GIVEN** `.opencode/dcp.jsonc` exists with invalid JSON
  content (after comment stripping)
- **WHEN** `uf init` runs
- **THEN** the result reports an error with context and the
  file is not modified

### FR-007: Doctor Health Check

The `uf doctor` command MUST verify that `.opencode/dcp.jsonc`
exists and contains `compress.protectTags: true` when
scaffolded commands with `<protect>` tags are present.

#### Scenario: DCP config present and correctly configured

- **GIVEN** `.opencode/dcp.jsonc` exists with
  `compress.protectTags: true`
- **WHEN** `uf doctor` runs
- **THEN** the check reports Pass with message
  "protectTags enabled"

#### Scenario: DCP config missing

- **GIVEN** `.opencode/dcp.jsonc` does not exist
- **WHEN** `uf doctor` runs
- **THEN** the check reports Fail with message "not found"
  and install hint "Run: uf init"

#### Scenario: DCP config exists but protectTags missing

- **GIVEN** `.opencode/dcp.jsonc` exists but does not contain
  `compress.protectTags: true`
- **WHEN** `uf doctor` runs
- **THEN** the check reports Warn with message
  "protectTags not enabled" and install hint
  "Run: uf init --force"

#### Scenario: DCP config exists but malformed

- **GIVEN** `.opencode/dcp.jsonc` exists with invalid JSON
  content (after comment stripping)
- **WHEN** `uf doctor` runs
- **THEN** the check reports Warn with message
  "malformed config" and install hint "Run: uf init --force"

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
