## Context

`uf init` scaffolds `.opencode/commands/` files that contain
`<protect>` tags (added via #497/#499). These tags are only
honored when OpenCode's DCP subsystem finds a `.opencode/dcp.jsonc`
configuration file with `compress.protectTags: true`. Without
this file, the tags are inert and protected sections are
compressed normally.

Issue #501 manually added the file to this repository, but the
scaffold engine does not create it for other projects. The
`configureOpencodeJSON()` function in `internal/scaffold/scaffold.go`
provides a proven pattern for idempotent JSON config creation
that we can follow.

## Goals / Non-Goals

### Goals
- `uf init` creates `.opencode/dcp.jsonc` with `protectTags: true`
- Idempotent: skip if file exists with correct config
- Additive: add `protectTags` if file exists but lacks it
- Respect `DryRun` flag
- Follow `configureOpencodeJSON()` structure for consistency
- File is committed to source control (not gitignored)
- Drift test coverage via `knownNonEmbeddedFiles` or embedded asset

### Non-Goals
- Configuring other DCP settings beyond `protectTags`
- Migrating existing projects that already have `dcp.jsonc`
- JSONC comment-preserving round-trip parsing (comments are
  written on creation only)
- Supporting DCP config in locations other than `.opencode/`
- Handling `--divisor` mode differently (the DCP config call
  lives inside `initSubTools()` which returns early when
  `opts.DivisorOnly` is true — this is acceptable because
  Divisor-only deploys do not scaffold slash commands with
  `<protect>` tags)

## Decisions

### D1: Generate programmatically, not embed as asset

**Decision**: Generate `.opencode/dcp.jsonc` in code like
`configureOpencodeJSON()` does for `opencode.json`, rather than
embedding it as a scaffold asset in `internal/scaffold/assets/`.

**Rationale**: The file content is a fixed 5-line JSONC snippet.
Embedding it as an asset would require:
- Adding the file to the embed.FS
- Handling JSONC parsing for idempotent merge (no stdlib support)
- Adding drift test entries

Programmatic generation keeps the logic self-contained in a
single function and allows idempotent JSON manipulation using
`encoding/json`. The JSONC comment is written only on initial
creation; subsequent updates use standard JSON marshalling.

**Trade-off**: If the file format grows complex, an embedded
template would be cleaner. For a 5-line config, code generation
is simpler.

### D2: Add to `knownNonEmbeddedFiles` exclusion list

**Decision**: Add `.opencode/dcp.jsonc` to the
`knownNonEmbeddedFiles` map in `scaffold_test.go`.

**Rationale**: The drift test (`TestEmbeddedAssets_MatchSource`)
verifies that files in `.opencode/` are either embedded in the
binary or listed in the exclusion map. Since we are generating
this file programmatically (D1), it must appear in the exclusion
list to prevent test failures.

### D3: JSONC write, JSON read strategy

**Decision**: Write JSONC (with comments) on first creation.
Read as JSON (strip comments or use a JSONC parser) for
idempotent updates.

**Rationale**: JSONC comments improve developer experience by
explaining what `protectTags` does. However, `encoding/json`
cannot parse comments. Two approaches:

- **Option A**: Write the complete JSONC file as a raw string
  on creation. For existence/content checks, strip comments
  before JSON unmarshal. This is simple and avoids new deps.
- **Option B**: Use `github.com/goccy/go-yaml` (already a dep)
  — but it does not parse JSONC.

**Chosen**: Option A. Use `strings.NewReplacer` or line-based
comment stripping before `json.Unmarshal`. The file is small
and well-known.

### D4: Call site in `initSubTools()` pipeline

**Decision**: Call `configureDCPConfig(opts)` immediately after
`configureOpencodeJSON(opts)` at line 1375 in `initSubTools()`.

**Rationale**: Both functions configure OpenCode config files,
both run after all concurrent sub-tool init completes, and
both use the same `subToolResult` return pattern. Placing them
adjacent makes the pipeline flow obvious:
1. Wait for all concurrent tools
2. Configure `opencode.json`
3. Configure `dcp.jsonc`
4. Return aggregated results

### D5: File content format

**Decision**: Use the exact format from the manually-created
file (commit a319817):

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/Opencode-DCP/opencode-dynamic-context-pruning/master/dcp.schema.json",
  // Enable <protect> tag preservation during DCP compression.
  // Slash command files in .opencode/commands/ use <protect> tags
  // to mark execution-critical sections (guardrails, checklists,
  // mandatory gates) that must survive context pruning.
  "compress": {
    "protectTags": true
  }
}
```

**Rationale**: Consistency with the existing file in this repo
and schema-validated by the DCP JSON Schema.

### D6: Force overwrite behavior

**Decision**: `uf init --force` overwrites the file entirely.
Normal `uf init` only creates if absent or adds `protectTags`
if the key is missing from an existing file.

**Rationale**: Matches `configureOpencodeJSON()` behavior where
`opts.Force` triggers a full overwrite of managed entries.

### D7: Doctor health check in `checkScaffoldedFiles()`

**Decision**: Add a DCP config content check to the existing
`checkScaffoldedFiles()` function in `internal/doctor/checks.go`,
immediately after the `.specify/` existence check.

**Rationale**: The doctor's "Scaffolded Files" group already
checks for `.opencode/agents/`, `.opencode/commands/`,
`.opencode/uf/packs/`, and `.specify/`. Adding the DCP config
check here is the natural location — it validates another
scaffolded file. The check goes beyond existence: it reads
the file, strips JSONC comments (reusing `stripJSONCComments`
from the scaffold package or an equivalent inline strip), and
verifies `compress.protectTags: true` is set. This catches the
exact problem from issue #502 — protect tags present but
config missing or misconfigured.

**Severity mapping**:
- File missing → `Fail` (protect tags are inert without it)
- File exists but `protectTags` not set → `Warn` (partial config)
- File exists but malformed → `Warn` (user can fix with `uf init --force`)
- File exists with `protectTags: true` → `Pass`

**Trade-off**: The doctor check needs to strip JSONC comments
before parsing, same as `configureDCPConfig()`. Rather than
importing `stripJSONCComments` across packages (which would
export an internal helper), the doctor can use its own inline
comment-stripping logic — the file is small and the logic is
trivial (skip lines starting with `//`). Alternatively, a
shared `internal/textutil` helper could be created, but that
adds cross-package coupling for a 10-line function.

## Risks / Trade-offs

- **JSONC parsing fragility**: Comment stripping via string
  manipulation is fragile for complex JSONC. Acceptable here
  because the file is simple and well-known. If DCP config
  grows complex, switch to a proper JSONC parser.
- **Comment loss on update**: If the file exists and needs
  `protectTags` added, the update path uses `json.Marshal`
  which strips comments. Acceptable trade-off: the functional
  config is preserved, and comments are cosmetic.
- **No schema validation**: We write the `$schema` URL but
  do not validate against it at init time. The DCP runtime
  handles validation. Same pattern as `opencode.json`.
- **Mutable schema URL**: The `$schema` URL references the
  `master` branch, a mutable reference. This is acceptable
  because the schema is used only for editor validation
  (IDE autocompletion/linting), not for runtime security
  decisions. If the URL breaks, the only impact is loss of
  editor hints.
