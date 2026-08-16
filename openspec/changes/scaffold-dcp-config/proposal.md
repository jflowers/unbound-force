## Why

`uf init` scaffolds `.opencode/commands/` with `<protect>` tags
(added in #497/#499), but does NOT create the
`.opencode/dcp.jsonc` configuration file. Without this file,
DCP's `protectTags` feature is inert — the `<protect>` tags
have no effect and DCP compresses protected sections normally.

Issue #501 manually added `.opencode/dcp.jsonc` to this
repository, but the scaffold engine does not create it for
other projects. Every project that runs `uf init` receives
commands with `<protect>` tags but no DCP config to honor them.

Fixes #502.

## What Changes

Add a `configureDCPConfig()` function to the scaffold engine
that creates `.opencode/dcp.jsonc` during `uf init`. The
function follows the existing `configureOpencodeJSON()` pattern:
idempotent, respects `DryRun`, creates if absent, adds
`protectTags` if missing, skips if already correctly configured.

## Capabilities

### New Capabilities
- `DCP config scaffolding`: `uf init` creates
  `.opencode/dcp.jsonc` with `protectTags: true`, ensuring
  `<protect>` tags in scaffolded commands are honored by DCP.

### Modified Capabilities
- `uf init`: Gains a new configuration step for DCP config,
  integrated into the existing sub-tool pipeline alongside
  `configureOpencodeJSON()`.

### Removed Capabilities
- None.

## Impact

- **Scaffold engine**: New `configureDCPConfig()` function in
  `internal/scaffold/scaffold.go`.
- **Embedded assets**: New `dcp.jsonc` file added to
  `internal/scaffold/assets/opencode/dcp.jsonc` for drift
  detection (or generated programmatically like
  `opencode.json`).
- **Existing projects**: `uf init` creates the file if absent.
  `uf init --force` overwrites if present. No destructive
  changes to existing valid configurations.
- **New projects**: Automatically receive working DCP
  `protectTags` configuration on first `uf init`.
- **Doctor command**: `uf doctor` gains a DCP config content
  check in the "Scaffolded Files" group, verifying
  `.opencode/dcp.jsonc` exists with `protectTags: true`.
- **Testing**: Drift tests, scaffold integration tests, and
  doctor check tests updated.
- **Documentation**: `CHANGELOG.md` entry needed. A `docs`
  issue should be filed to document that `uf init` now creates
  `.opencode/dcp.jsonc`.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

This change ensures that artifact-based guardrails (protect
tags in slash commands) function correctly across compression
cycles. Agents can autonomously resume sessions with their
execution state intact, improving artifact-based collaboration.

### II. Composability First

**Assessment**: N/A

No new inter-hero dependencies. The DCP config is a local
OpenCode feature that each project independently consumes.
The scaffold creates it alongside existing OpenCode
configuration.

### III. Observable Quality

**Assessment**: PASS

The configuration file is a machine-parseable JSON artifact
with a `$schema` reference. The scaffold engine reports
creation/skip/error status through the existing `subToolResult`
mechanism, maintaining observable output.

### IV. Testability

**Assessment**: PASS

The `configureDCPConfig()` function uses the same injectable
`ReadFile`/`WriteFile` pattern as `configureOpencodeJSON()`,
making it testable in isolation without filesystem access.
Drift tests verify embedded assets match canonical sources.

### V. Security by Default

**Assessment**: N/A

No new dependencies are introduced. The file content is a
fixed JSONC snippet with a well-known schema URL used only for
editor validation, not runtime security decisions. No external
inputs are processed — the file content is hardcoded. File
permissions follow the scaffold engine's existing `0o644`
convention.
