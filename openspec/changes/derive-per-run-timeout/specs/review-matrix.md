<!-- capability: review-matrix
     change: derive-per-run-timeout
     originating_issue: 849 -->

Requirement numbering: RD-FR-009 and RD-FR-010 are drawn from
the RD-FR-009..018 block reserved for future review-matrix
changes (allocation recorded in
openspec/changes/optional-profile-models). This change's
review-dispatch requirements live in
specs/review-dispatch/spec.md.

## ADDED Requirements

### Requirement: Optional Per-Run Timeout Derivation Fields

**ID: RD-FR-009** This requirement MUST be satisfied.

The review matrix limits surface MUST accept two optional
fields without requiring any change to the canonical
`.uf/review-matrix.yaml`:

- `per_run_timeout_ceiling_seconds` — an integer between 30
  and 1800 (inclusive) bounding the derived per-run timeout
  ceiling; when absent, the code default is 1800 (the schema
  bound).
- `per_run_timeout_tiers` — optional per-tier base-window
  overrides for `lightweight`, `standard`, and `heavy`, each
  an integer between 30 and 1800 (inclusive); when absent
  for a tier, the scalar limit applies.

An override configured for a run's resolved tier MUST take
precedence over the scalar limit as that run's base window.
The canonical `.uf/review-matrix.yaml` MUST NOT be modified
by this schema addition: setting values for the new fields
there is a review-limit change requiring documented
maintainer authorization.

#### Scenario: Absent fields keep code defaults

- **GIVEN** a review matrix whose `limits` carry neither new
  field
- **WHEN** the matrix is parsed and a per-run timeout is
  derived
- **THEN** the ceiling defaults to 1800 seconds and every
  tier uses the scalar limit as its base window

#### Scenario: Per-tier override wins for its tier

- **GIVEN** `per_run_timeout_tiers` configuring
  `heavy: 1500`
- **WHEN** a run dispatches under the `heavy` tier
- **THEN** that run's base window is 1_500_000 milliseconds
- **AND** a run under a tier without an override uses the
  scalar limit

#### Scenario: Out-of-range values are rejected

- **GIVEN** a matrix carrying a
  `per_run_timeout_ceiling_seconds` or per-tier override
  value outside 30..1800
- **WHEN** the matrix is parsed
- **THEN** validation rejects the matrix with an error naming
  the offending field

### Requirement: Canonical JSON Schema Registry Sync

**ID: RD-FR-010** This requirement MUST be satisfied.

The canonical JSON Schema registry MUST stay in lockstep with
the plugin `LimitsSchema` across all three maintained copies:
the root registry, the deployed copy, and the embedded
scaffold asset. The root `schemas/review-matrix/
v3.schema.json` `$defs/limits` MUST gain the two optional
fields from RD-FR-009 with the same 30..1800 integer bounds,
added in-place and backward compatibly (the registry stays
v3 — existing valid matrices MUST still validate). The
deployed copy `.uf/schemas/review-matrix/v3.schema.json` and
the embedded scaffold asset
`internal/scaffold/assets/uf/schemas/review-matrix/v3.schema.json`
MUST carry the same schema content, byte-identical (the
embedded/deployed pair is drift-test-enforced). Boundary
samples MUST exercise the new fields, including out-of-range
rejection cases in `invalid-limits.json`, and the registry
README version history MUST record the addition.

#### Scenario: Registry accepts the new optional fields

- **GIVEN** a matrix carrying valid
  `per_run_timeout_ceiling_seconds` and
  `per_run_timeout_tiers`
- **WHEN** it is validated against the registry schema
- **THEN** validation succeeds
- **AND** the deployed and embedded copies carry the same
  schema content as the root registry

#### Scenario: Registry rejects out-of-range values

- **GIVEN** a sample matrix carrying a new field outside the
  30..1800 bounds
- **WHEN** it is validated against the registry schema
- **THEN** validation fails

#### Scenario: Existing valid matrices still validate

- **GIVEN** matrices valid before the field addition
- **WHEN** they are validated against the updated registry
- **THEN** they remain valid (the addition is optional)
