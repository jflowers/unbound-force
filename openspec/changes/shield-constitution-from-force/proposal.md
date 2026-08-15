## Why

`uf init --force` unconditionally overwrites all existing files,
including `.specify/memory/constitution.md`. The constitution is a
user-customized governance document that anchors all spec-driven
work. Overwriting it with the embedded starter template destroys
project-specific principles, hero alignment references, and
governance history.

The `--force` flag was designed to refresh tool-owned assets
(commands, schemas, convention packs) to the latest version. It
was never intended to destroy user governance artifacts. This
defect was introduced in PR #480 when the starter constitution
was added as an embedded scaffold asset without an exception to
the force-overwrite path.

Fixes #495.

## What Changes

Add a "never overwrite" guard in the scaffold engine that
protects designated files from being overwritten even when
`--force` is specified. The constitution file is the first
(and currently only) member of this protected set.

## Capabilities

### New Capabilities
- `isNeverOverwrite`: Predicate function that identifies files
  exempt from `--force` overwrite (returns `true` for
  `specify/memory/constitution.md`)

### Modified Capabilities
- `Run()`: Force-overwrite path now checks `isNeverOverwrite`
  before writing; protected files are silently added to
  `Skipped` instead of `Overwritten`

### Removed Capabilities
- None

## Impact

- **internal/scaffold/scaffold.go**: New `isNeverOverwrite`
  function; guard clause inserted before the `opts.Force` block
- **internal/scaffold/scaffold_test.go**: Updated force test
  to assert constitution lands in `Skipped`; new table-driven
  `TestIsNeverOverwrite`
- **UX**: Silent skip — no warning or special notice. The file
  appears in the `Skipped` list alongside other user-owned files
  that were not overwritten.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change is internal to the scaffold engine and does not
affect artifact-based communication between heroes or
inter-hero data exchange.

### II. Composability First

**Assessment**: N/A

This change does not affect hero independence or integration
points. The scaffold engine remains standalone.

### III. Observable Quality

**Assessment**: PASS

The scaffold `Result` struct continues to report all file
dispositions (Created, Skipped, Overwritten, Updated). Protected
files appear in `Skipped`, maintaining full observability of what
happened during a scaffold run.

### IV. Testability

**Assessment**: PASS

The fix adds a pure predicate function (`isNeverOverwrite`) that
is trivially testable in isolation. The existing scaffold test
infrastructure (`t.TempDir()`, no external services) covers the
integration behavior. A table-driven test for the new predicate
is included.

### V. Security by Default

**Assessment**: N/A

This change does not introduce dependencies, handle external
input, or modify privilege boundaries. File permissions remain
at the existing 0o644 default.
