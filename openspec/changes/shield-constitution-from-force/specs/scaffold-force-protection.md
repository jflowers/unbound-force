## ADDED Requirements

### Requirement: Never-Overwrite File Protection

The scaffold engine MUST define an `isNeverOverwrite` predicate
that identifies files exempt from `--force` overwrite. The
predicate MUST return `true` for `specify/memory/constitution.md`.

FR-001: `isNeverOverwrite` MUST be a pure function accepting a
relative path (using the embedded asset path convention, without
the leading dot) and returning a boolean. The predicate performs
exact string comparison. Path normalization (case, separators,
traversal components) is the caller's responsibility.

FR-002: `isNeverOverwrite` MUST return `true` for the path
`specify/memory/constitution.md`.

FR-003: `isNeverOverwrite` MUST return `false` for all other
paths, including tool-owned files and other user-owned files.

### Test Strategy

- **Unit**: `TestIsNeverOverwrite` — table-driven test for the
  pure predicate function.
- **Integration**: Updated `TestRun_ConstitutionProtectedWithForce`
  — full scaffold run with `--force`, verifying the constitution
  is in `Skipped` and retains user content.
- **Coverage target**: 100% of new lines (guard clause +
  predicate).

#### SC-001: Constitution file exists and force is specified

- **GIVEN** `.specify/memory/constitution.md` exists in the
  target directory with user-customized content
- **WHEN** `uf init --force` is executed
- **THEN** the constitution file MUST NOT be overwritten
- **AND** the file MUST appear in `Result.Skipped`
- **AND** the file MUST NOT appear in `Result.Overwritten`

#### SC-002: Constitution file does not exist

- **GIVEN** `.specify/memory/constitution.md` does not exist
  in the target directory
- **WHEN** `uf init` is executed (with or without `--force`)
- **THEN** the constitution file MUST be created from the
  embedded starter template
- **AND** the file MUST appear in `Result.Created`

#### SC-003: Non-protected file with force

- **GIVEN** a tool-owned file (e.g., `.opencode/commands/uf.init.md`)
  exists in the target directory
- **WHEN** `uf init --force` is executed
- **THEN** the file MUST be overwritten as before
- **AND** the file MUST appear in `Result.Overwritten`

#### SC-004: Predicate returns false for tool-owned files

- **GIVEN** a relative path matching a tool-owned file
  (e.g., `opencode/commands/uf.init.md`)
- **WHEN** `isNeverOverwrite` is called with that path
- **THEN** it MUST return `false`

#### SC-005: Predicate returns false for other user-owned files

- **GIVEN** a relative path matching a user-owned file that
  is not the constitution
  (e.g., `opencode/agents/cobalt-crush-dev.md`)
- **WHEN** `isNeverOverwrite` is called with that path
- **THEN** it MUST return `false`

#### SC-006: Predicate handles empty path

- **GIVEN** an empty string
- **WHEN** `isNeverOverwrite` is called with that path
- **THEN** it MUST return `false`

## MODIFIED Requirements

### Requirement: Force-overwrite behavior

Previously: `--force` overwrites all existing files
unconditionally.

Modified: `--force` overwrites all existing files except those
identified by `isNeverOverwrite`. Protected files MUST be added
to `Result.Skipped` and MUST NOT be written.

## REMOVED Requirements

None.
