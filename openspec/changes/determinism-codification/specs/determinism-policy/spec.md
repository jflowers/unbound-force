# Determinism Policy

## ADDED Requirements

### Requirement: Constitution Principle VI — Deterministic Execution

The org constitution MUST define Principle VI "Deterministic
Execution" after Principle V, stating that agent context is a
scarce shared resource and that deterministic procedures MUST
execute in tools rather than be re-reasoned from prose.

#### Scenario: Principle present and versioned

- **GIVEN** the org constitution at `.specify/memory/constitution.md`
- **WHEN** the Core Principles headings are enumerated
- **THEN** `### VI. Deterministic Execution` follows Principle V

### Requirement: Principle VI rule coverage

Principle VI MUST cover four rules: mechanical procedures as
executable tools with tests; tool-rendered prescribed output
(behavioral guards are interim mitigations, not the mechanism of
record); preserved output-format examples near consuming decision
points; and measurable line/token deltas for efficiency claims.

#### Scenario: Four rules present

- **GIVEN** the body of Principle VI
- **WHEN** its rules are enumerated
- **THEN** it covers tools-with-tests for mechanical procedures,
  tool-rendered prescribed output, preserved decision-point
  examples, and measurable efficiency deltas

### Requirement: Constitution version and amendment record

The constitution version MUST bump 1.3.1 → 1.4.0 (MINOR: new
principle) and the amendment log MUST record the addition and
the hero alignment obligation.

#### Scenario: Version bumped and log updated

- **GIVEN** the constitution footer and SYNC IMPACT REPORT comment
- **WHEN** the amendment lands
- **THEN** the footer version reads `1.4.0` with an updated Last
  Amended date
- **AND** the SYNC IMPACT REPORT records the new principle and
  the hero alignment obligation

### Requirement: Determinism convention pack

The repository MUST provide `.opencode/uf/packs/determinism.md`
defining review rules DE-001 through DE-004 with RFC 2119
markers. The pack MUST be repo-local, governance-styled
(domain-specific sections per the `content.md`/`ci.md`
precedent), and auto-discovered by review prompt assembly.

#### Scenario: Pack included in review prompts

- **GIVEN** the pack exists at `.opencode/uf/packs/determinism.md`
- **WHEN** `build_review_prompts` assembles a Divisor review prompt
- **THEN** the determinism pack content is included alongside the
  existing convention packs, with no plugin code changes required

#### Scenario: Pack is repo-local

- **GIVEN** `make test` runs the canonical-embedded drift tests
- **WHEN** `.opencode/uf/packs/determinism.md` is present
- **THEN** the file is listed in `knownNonEmbeddedFiles`
- **AND** no corresponding scaffold asset exists

#### Scenario: Pack passes the pack-validation gate

- **GIVEN** `make test` runs
  `TestValidateConventionPack_AllPacksValid`
- **WHEN** the governance-style determinism pack is present
- **THEN** `determinism.md` is skipped with a rationale comment,
  following the `severity.md`, `content.md`, and `ci.md`
  precedent

### Requirement: Pack MUST rules DE-001 and DE-003

DE-001 [MUST]: mechanical instruction added to commands, agents,
or skills MUST be extracted to an executable tool with tests.
DE-003 [MUST]: prescribed terminal output MUST be tool-rendered,
not reconstructed from instructed templates.

#### Scenario: MUST rules present in pack

- **GIVEN** the determinism pack
- **WHEN** its rules are read
- **THEN** DE-001 and DE-003 carry `[MUST]` markers with severity
  mapping consistent with the severity pack

### Requirement: Pack SHOULD rules DE-002 and DE-004

The pack MUST define DE-002 [SHOULD]: extractions preserve one or
two tool output-format examples near the decision points that
consume them; and DE-004 [SHOULD]: change records include
line/token deltas when instruction text changes.

#### Scenario: SHOULD rules present in pack

- **GIVEN** the determinism pack
- **WHEN** its rules are read
- **THEN** DE-002 and DE-004 carry `[SHOULD]` markers

### Requirement: Determinism-first skill

The repository MUST provide
`.opencode/skills/determinism-first/SKILL.md` with YAML frontmatter
(name, description, tags) and body guidance that instructs agents
to classify work before writing: deterministic steps (fixed
procedure, same output every time) belong in tool calls; judgment
steps (decisions, evaluation, human interaction) belong in prose.

#### Scenario: Skill discoverable in sessions

- **GIVEN** the skill file exists under `.opencode/skills/`
- **WHEN** opencode enumerates available skills
- **THEN** `determinism-first` is discoverable with its description

#### Scenario: Skill is repo-local

- **GIVEN** `make test` runs the canonical-embedded drift tests
- **WHEN** `.opencode/skills/determinism-first/SKILL.md` is present
- **THEN** the file is listed in `knownNonEmbeddedFiles`
- **AND** no corresponding scaffold asset exists

### Requirement: AGENTS.md determinism gate

AGENTS.md MUST include a "Determinism gate" Behavioral Rule at
CRITICAL severity prohibiting the addition of mechanical
procedural prose (parsing, existence checks, git choreography,
output template rendering, enumeration loops) to commands, agents,
or skills where an executable tool is feasible.

#### Scenario: Behavioral rule present

- **GIVEN** AGENTS.md
- **WHEN** the Behavioral Rules section is read
- **THEN** a "Determinism gate" rule exists with RFC 2119 MUST
  language and CRITICAL severity classification

### Requirement: AGENTS.md pack listing is exhaustive

The Convention Packs section of AGENTS.md MUST list every pack
file present in `.opencode/uf/packs/`, including `determinism.md`
and the previously unlisted `ci.md` and `ci-custom.md`.

#### Scenario: Pack listing matches directory

- **GIVEN** the Convention Packs section of AGENTS.md
- **WHEN** the listed packs are compared against the files in
  `.opencode/uf/packs/`
- **THEN** every pack file in the directory is listed

### Requirement: Change record

The change MUST record the codification in `CHANGELOG.md` per the
AGENTS.md documentation gate, covering the constitution amendment,
the determinism pack, the determinism-first skill, and the AGENTS.md
rule.

#### Scenario: CHANGELOG entry present

- **GIVEN** the change lands
- **WHEN** `CHANGELOG.md` is read
- **THEN** an entry describes the constitution amendment (1.4.0),
  the pack, the skill, and the AGENTS.md rule
