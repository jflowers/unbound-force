# scaffold Reproducible Plugin Dependencies Pin Move

Parent: the declared `@opencode-ai/plugin` 1.4.10 → 1.19.0
dependency update (design D7) moves a pin record that the
unarchived `review-council-multi-model-fanout` change's
SC-FR-003 requirement carries as MUST text; this delta moves
the spec record with the manifest so the requirement does not
contradict the shipped pin when the predecessor archives. The
requirement text below is the predecessor's text verbatim with
only the pin version and the rollback baseline lock SHA256
moved to the new values.

## ADDED Requirements

None.

## MODIFIED Requirements

### Requirement: Reproducible Plugin Dependencies

**ID: SC-FR-003** This requirement MUST be satisfied.

The repository and scaffold MUST track `.opencode/package.json` and
`.opencode/package-lock.json`. Direct dependencies MUST pin
`@opencode-ai/plugin` 1.19.0 and Zod 4.1.8.
Test dependencies MUST pin Vitest 5.0.3 and
`@vitest/coverage-v8` 5.0.3.

The plugin package MUST provide the supported OpenCode plugin, tool,
and
client ABI. Zod MUST provide the SDK-compatible runtime schemas used by
the tool.
Vitest MUST provide TypeScript ESM mocking and threshold enforcement.
The V8 adapter MUST provide branch and statement instrumentation.
Hand-written session protocols and a custom Node test harness MUST NOT
replace these maintained interfaces in this change.

All four dependencies MUST retain their MIT license and exact version.
The npm lock MUST retain integrity hashes. Implementation verification
MUST fail on license, version, manifest, lock, or integrity mismatch.
Rollback MUST remove both plugin activations, the reviewer manifest,
scripts, and direct dependencies. It MUST restore host-model Task
dispatch, `.opencode/.gitignore`, and the tracked baseline lock whose
SHA256 is
`5ebee4af68d7a6125f5d0f52ecca7c419bbfbd9beff13503f3d5d6f36a09f965`.

`.opencode/.gitignore` MUST ignore `node_modules` and `bun.lock`. It
MUST NOT ignore `package.json` or `package-lock.json`. Tests and
`uf doctor` MUST validate manifest and lock consistency.

#### Scenario: Fresh checkout dependencies

- **GIVEN** a fresh checkout has no installed modules
- **WHEN** npm validates the manifest and lock
- **THEN** the locked runtime install has a reproducible input
- **AND** no generated manifest is required

## REMOVED Requirements

None.
