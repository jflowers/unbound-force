## ADDED Requirements

### Requirement: Commit attribution via normalize_model_name

Phase 4.2 (Commit Changes) of `uf.address-feedback.md`
MUST resolve the `Assisted-by:` trailer's model family name
by calling the `uf-workflow` plugin's `normalize_model_name`
tool with the raw model identifier from the system prompt,
and MUST use the returned `normalized` value.

The command MUST NOT embed the 6-step normalization
algorithm (provider prefix strip, `@` suffix strip, `-YYYYMMDD`
date suffix strip, trailing `-N` version strip, charset
validation, `unknown-model` fallback) as inline instruction
prose.

If the tool returns an error or `normalized:
"unknown-model"`, the command MUST warn the user and use the
literal string `unknown-model` in the attribution trailer.

#### Scenario: Standard model identifier

- **GIVEN** Phase 4.2 commit message generation and a raw
  model identifier
  `google-vertex-anthropic/claude-sonnet-4-20250514@default`
- **WHEN** the command resolves the `Assisted-by:` trailer
- **THEN** `normalize_model_name` is called with the raw
  identifier and the trailer reads
  `Assisted-by: claude-sonnet-4`

#### Scenario: Unresolvable model identifier

- **GIVEN** Phase 4.2 commit message generation and a raw
  model identifier that is empty or unnormalizable
- **WHEN** `normalize_model_name` returns
  `{normalized: "unknown-model", warning: "..."}`
- **THEN** the command warns the user and the trailer reads
  `Assisted-by: unknown-model`

#### Scenario: Tool invocation failure

- **GIVEN** Phase 4.2 commit message generation
- **WHEN** `normalize_model_name` cannot be called or
  returns an error
- **THEN** the command warns the user and the trailer reads
  `Assisted-by: unknown-model`

### Requirement: Scaffold and live command parity

The scaffold copy at
`internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
MUST remain byte-identical to the live command at
`.opencode/commands/uf.address-feedback.md` after the
normalization migration.

#### Scenario: Drift detection after migration

- **GIVEN** both copies updated with the
  `normalize_model_name` tool call instruction
- **WHEN** scaffold drift tests compare the live and
  scaffold copies
- **THEN** the copies are byte-identical and the tests pass

#### Scenario: No inline algorithm remains

- **GIVEN** the migrated command files
- **WHEN** the files are searched for the inline
  normalization prose (e.g., the `-YYYYMMDD` step
  description)
- **THEN** no instruction-level copy of the 6-step
  algorithm is present; only the tool call instruction
  remains
