## ADDED Requirements

### Requirement: Reviewer capabilities manifest is a project-owned extension point

The scaffold MUST classify `uf/reviewer-capabilities.yaml` as
project-owned: created from the embedded canonical asset when
absent, skipped on plain `uf init` re-runs when present, and
replaced with the canonical asset only under `--force`. Locally
added `reviewers:` entries MUST survive plain re-runs
byte-for-byte.

The classification MUST match `uf/review-matrix.yaml`, giving
all three artifacts a generated repository edits to register a
custom Divisor agent the same ownership semantics.

#### Scenario: First deploy seeds the manifest

- **GIVEN** a target directory without
  `.uf/reviewer-capabilities.yaml`
- **WHEN** `uf init` runs
- **THEN** the file is created from the embedded canonical
  asset and reported in the `Created` disposition list

#### Scenario: Local reviewer entry survives re-init

- **GIVEN** a deployed `.uf/reviewer-capabilities.yaml` whose
  `reviewers:` list contains a locally added entry for a custom
  `divisor-*` agent
- **WHEN** `uf init` re-runs without `--force`
- **THEN** the file is reported in `Skipped` (not `Updated`)
  and its on-disk content is byte-identical to the content
  before the re-run

#### Scenario: Force resets local modifications

- **GIVEN** a deployed `.uf/reviewer-capabilities.yaml`
  containing local modifications
- **WHEN** `uf init` re-runs with `--force`
- **THEN** the file is replaced with the embedded canonical
  asset and reported in the `Overwritten` disposition list

#### Scenario: Canonical list changes do not auto-flow

- **GIVEN** a generated repository whose
  `.uf/reviewer-capabilities.yaml` was seeded by an earlier
  unbound-force release
- **WHEN** a later release changes the embedded canonical
  asset and the repository re-runs plain `uf init`
- **THEN** the deployed file is not modified

### Requirement: Ownership split stays test-pinned

The scaffold ownership classification for review-config assets
MUST be pinned by table-driven tests: `uf/review-matrix.yaml`
and `uf/reviewer-capabilities.yaml` MUST both classify as
project-owned, while the JSON Schemas under `uf/schemas/` MUST
remain tool-owned. Drift-detection tests MUST continue to pair
each embedded review-config asset with its deployed `.uf/`
copy in this repository, keeping them byte-identical.

#### Scenario: Ownership table covers both review-config files

- **GIVEN** the scaffold ownership test table
- **WHEN** `isToolOwned` is evaluated for
  `uf/reviewer-capabilities.yaml` and `uf/review-matrix.yaml`
- **THEN** both return false (project-owned), and the schema
  assets under `uf/schemas/reviewer-capabilities/` return true

#### Scenario: Embedded and deployed copies stay in sync

- **GIVEN** this repository's deployed `.uf/` review-config
  copies
- **WHEN** drift-detection tests run
- **THEN** each embedded asset remains byte-identical to its
  deployed `.uf/` copy

### Requirement: Change record and ownership documentation

The change MUST record the reclassification in `CHANGELOG.md`
under Unreleased, and MUST document the symmetric seeding and
survival semantics for both review-config files in
`docs/architecture.md` (File Ownership Model) and
`docs/configuration.md` (Review Council Configuration),
including that `--force` is a destructive reset for both.

#### Scenario: Documentation states survival semantics

- **GIVEN** a reader of `docs/configuration.md` or
  `docs/architecture.md`
- **WHEN** they look up `.uf/reviewer-capabilities.yaml`
- **THEN** the docs state that the file is seeded once,
  survives plain `uf init` re-runs, and is reset only by
  `--force`, matching the documented semantics of
  `.uf/review-matrix.yaml`

#### Scenario: CHANGELOG entry present

- **GIVEN** the change lands
- **WHEN** `CHANGELOG.md` is read
- **THEN** an Unreleased entry describes the
  reclassification of `.uf/reviewer-capabilities.yaml` from
  tool-owned to project-owned and its user-visible effect
