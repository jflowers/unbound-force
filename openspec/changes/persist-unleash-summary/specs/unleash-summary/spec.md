## ADDED Requirements

### Requirement: FR-001 Artifact location and branch keying

The `persist_unleash_summary` tool MUST write the demo summary
artifact to `<project-root>/.uf/artifacts/unleash-summary/<slug>.json`,
where `<slug>` is the current git branch passed through the
shared `sanitizeSlug` helper. The branch MUST be auto-detected
in the tool via `git rev-parse --abbrev-ref HEAD`; no
caller-supplied branch override is accepted, so the write path
stays symmetric with the `uf_finale_pr_context` read path.

#### Scenario: Branch with slash produces hyphenated slug

- **GIVEN** the current branch is `opsx/my-change`
- **WHEN** `persist_unleash_summary` is invoked with valid
  section content
- **THEN** the artifact is written to
  `.uf/artifacts/unleash-summary/opsx-my-change.json`

#### Scenario: Detached HEAD fails without writing

- **GIVEN** the repository is in detached HEAD state
- **WHEN** `persist_unleash_summary` is invoked
- **THEN** the tool returns a failure envelope
- **AND** no artifact file is written

### Requirement: FR-002 Artifact schema matches consumer contract

The artifact MUST be a JSON object whose top-level string fields
`whatWasBuilt`, `howToVerify`, and `testResults` carry the
markdown bodies of the Step 10 demo sections, and whose
provenance metadata fields (`artifact_type`, `schema_version`,
`branch`, `timestamp`) identify the artifact kind and origin.
The schema MUST be flat camelCase at the top level so the
whole-file-passthrough consumer can read the content fields
without unwrapping. Consumers MUST ignore unknown fields.

#### Scenario: Written artifact contains contract fields

- **GIVEN** `persist_unleash_summary` succeeds with distinct
  section content
- **WHEN** the artifact file is read and parsed
- **THEN** `whatWasBuilt`, `howToVerify`, and `testResults` are
  top-level string fields equal to the passed content
- **AND** `artifact_type` is `"unleash-summary"`,
  `schema_version` is `1`, `branch` is the raw branch name, and
  `timestamp` is a valid ISO 8601 string

#### Scenario: Consumer read path finds the fields

- **GIVEN** an artifact written by `persist_unleash_summary` on
  branch `opsx/my-change`
- **WHEN** `uf_finale_pr_context` reads
  `.uf/artifacts/unleash-summary/opsx-my-change.json`
- **THEN** the returned `unleashSummary` object exposes non-null
  `whatWasBuilt` and `howToVerify` strings at the top level

### Requirement: FR-003 Overwrite and path hardening semantics

A re-run on the same branch MUST overwrite the existing artifact
unconditionally (latest run is authoritative; no round tracking).
The tool MUST create the artifact directory recursively when
absent, serialize as pretty-printed JSON with a trailing newline,
and MUST NOT follow symlinks for the target file or its parent
directory (matching the checkpoint `writeState` hardening
pattern).

#### Scenario: Re-run overwrites previous artifact

- **GIVEN** an artifact for the current branch already exists
  with older content
- **WHEN** `persist_unleash_summary` is invoked with new content
- **THEN** the file is replaced and contains only the new
  content and refreshed `timestamp`

#### Scenario: Directory is created on first write

- **GIVEN** `.uf/artifacts/unleash-summary/` does not exist
- **WHEN** `persist_unleash_summary` is invoked
- **THEN** the directory is created recursively and the artifact
  is written successfully

### Requirement: FR-004 Input validation

All three tool parameters MUST be non-empty, non-whitespace-only
strings. A violation MUST return a failure envelope with error
code `INVALID_UNLEASH_SUMMARY` and MUST NOT write or overwrite
any file. This prevents `/uf.finale` from preferring an empty
artifact over its no-artifact fallback.

#### Scenario: Empty section content is rejected

- **GIVEN** `persist_unleash_summary` is invoked with
  `whatWasBuilt` set to `""` or whitespace
- **WHEN** the tool executes
- **THEN** a failure envelope with code
  `INVALID_UNLEASH_SUMMARY` is returned
- **AND** no file is written

### Requirement: FR-005 Tool registration and result envelope

The tool MUST be registered in the `uf-workflow` plugin server
tool map as `persist_unleash_summary`, implemented by an exported
factory `createPersistUnleashSummaryTool(exec, cwd)` following
the plugin's dependency-injection pattern. Success MUST return
the standard `success()` envelope including the resolved artifact
path and branch. Operational failures (git, filesystem) MUST
return a `failure()` envelope with code
`PERSIST_UNLEASH_SUMMARY_ERROR`.

#### Scenario: Tool is registered with injectable dependencies

- **GIVEN** the `uf-workflow` plugin server is initialized
- **WHEN** its tool map is inspected
- **THEN** `persist_unleash_summary` is present and constructed
  from an injectable `GitExec` and working directory

### Requirement: FR-006 Step 10 persistence instruction

`/uf.unleash.md` Step 10 MUST instruct the agent to call
`persist_unleash_summary` with the markdown bodies of the three
presented demo sections (excluding the `##` headers), after the
demo output is composed and before the Step 10 CHECKPOINT. The
command prose MUST NOT contain mechanical instructions for
branch detection, path construction, or JSON serialization
(determinism gate). On tool failure the workflow MUST warn and
continue; it MUST NOT abort the demo step or the pipeline.

#### Scenario: Artifact call sits between output and checkpoint

- **GIVEN** the canonical `/uf.unleash.md` Step 10 section
- **WHEN** its instruction order is read
- **THEN** the `persist_unleash_summary` call appears after the
  demo format block and before the CHECKPOINT directive

#### Scenario: Write failure does not block completion

- **GIVEN** `persist_unleash_summary` returns a failure envelope
- **WHEN** the agent processes the failure
- **THEN** a warning is presented and the Step 10 CHECKPOINT
  still executes (pipeline completes)

### Requirement: FR-007 Scaffold parity

The canonical changes to `.opencode/commands/uf.unleash.md` and
`.opencode/plugins/uf-workflow/index.ts` MUST be mirrored
byte-identically into
`internal/scaffold/assets/opencode/commands/uf.unleash.md` and
`internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`.
The existing embedded-asset drift tests MUST pass after the
sync; no new asset files are introduced.

#### Scenario: Drift tests pass after mirror sync

- **GIVEN** canonical files are updated and mirrored to the
  scaffold assets
- **WHEN** the `TestEmbeddedAssets` drift tests run
- **THEN** canonical and scaffold copies match byte-for-byte

### Requirement: FR-008 Consumer side remains unchanged

This change MUST NOT modify `.opencode/plugins/uf-finale/index.ts`
or `.opencode/commands/uf.finale.md`. The finale consumer and
its no-artifact fallback are already implemented and specced by
`finale-token-reduction`; the producer MUST conform to them.

#### Scenario: Consumer files are untouched

- **GIVEN** this change is implemented
- **WHEN** the diff is reviewed
- **THEN** `.opencode/plugins/uf-finale/index.ts` and
  `.opencode/commands/uf.finale.md` contain no changes
