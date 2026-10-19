# Determinism Policy

## ADDED Requirements

### Requirement: Intent-level orchestration rules DE-005 and DE-006

The determinism pack MUST append two rules in a new terminal
section `## Intent-Level Orchestration` placed after
`## Efficiency Evidence`: DE-005 [MUST] — a fixed sequence of
tool calls with no judgment between steps, where each next call
and its arguments are fully determined by the previous call's
structured result, MUST be collapsed into a single intent-level
tool that receives judgment products (composed text, human gate
decisions) as parameters; and DE-006 [SHOULD] — intent-level
tools keep judgment at their boundary, with routing decisions
(verdict mapping, severity sorting, exit-variant selection,
batch scheduling, failure-stop) executing inside the tool as
constants or pure functions.

#### Scenario: New rules present with pinned severity

- **GIVEN** the determinism pack at
  `.opencode/uf/packs/determinism.md`
- **WHEN** its rules are read
- **THEN** DE-005 carries a `[MUST]` marker and DE-006 carries a
  `[SHOULD]` marker
- **AND** both appear under `## Intent-Level Orchestration`

#### Scenario: Terminal section placement

- **GIVEN** the pack's section order
- **WHEN** `## Intent-Level Orchestration` is located
- **THEN** it follows `## Efficiency Evidence` and is the final
  rule-bearing section of the document

### Requirement: Pack version bump for intent-level rules

The pack frontmatter MUST declare `version: 1.1.0`, and the
severity-mapping sentence MUST list the MUST rules as
"(DE-001, DE-003, DE-005)" and the SHOULD rules as "(DE-002,
DE-004, DE-006)".

#### Scenario: Version and severity mapping updated

- **GIVEN** the edited pack
- **WHEN** the frontmatter and severity-mapping paragraph are
  read
- **THEN** the version reads `1.1.0`
- **AND** the MUST list includes DE-005 and the SHOULD list
  includes DE-006

### Requirement: Stability of existing rule identifiers

Existing rule IDs MUST remain stable. The pack's DE-001 through
DE-004 rule text MUST remain byte-unchanged, and the skill's
"DE-001 through DE-004" citation MUST update to "DE-001 through
DE-006" without renumbering or mid-document insertion of pack
rules; rule ID MUST equal document order.

#### Scenario: Existing rules untouched

- **GIVEN** the pack before and after the change
- **WHEN** the DE-001..DE-004 rule text is compared
- **THEN** the bytes are identical

#### Scenario: Appended, not inserted

- **GIVEN** the pack's rule sequence
- **WHEN** rule IDs are enumerated in document order
- **THEN** DE-005 and DE-006 are the last two rules

### Requirement: Determinism-first skill chain-collapse guidance

The determinism-first skill MUST extend authoring-time
classification to sequences: the frontmatter description's
second sentence covers judgment-free tool chains (first sentence
byte-identical); the twice-test paragraph extends one level up;
the mechanical-procedures list adds tool-chain orchestration and
lookup-table branching bullets; the numbered extraction procedure
gains a chain-collapse step; and a new section `## Chains
Without Judgment Collapse Too` explains sequence-level collapse
with the `uf_delegate_command` and `dispatch_review_runs`
precedents.

#### Scenario: Skill updates present

- **GIVEN** the edited skill at
  `.opencode/skills/determinism-first/SKILL.md`
- **WHEN** its sections and frontmatter are read
- **THEN** the description's first sentence is byte-identical to
  the prior version
- **AND** `## Chains Without Judgment Collapse Too` appears
  between `## Deterministic Steps Belong in Tools` and
  `## Judgment Belongs in Prose`
- **AND** "Related Enforcement" cites `DE-001 through DE-006`

#### Scenario: Skill still discoverable

- **GIVEN** the skill file under `.opencode/skills/`
- **WHEN** opencode enumerates available skills
- **THEN** `determinism-first` remains discoverable with the
  updated description

### Requirement: AGENTS.md layer decision recorded

The change record MUST record the AGENTS.md layer decision —
option (b), leaving the AGENTS.md determinism-gate category list
unchanged — with the rationale that the pack is the stricter,
more specific layer; constitution Principle VI supremacy
resolves conflicts upward; and DE-005 extends rather than
contradicts the AGENTS.md enumeration.

#### Scenario: Decision recorded with rationale

- **GIVEN** the change's artifacts
- **WHEN** the AGENTS.md layer decision is sought
- **THEN** option (b) is stated with the three-part rationale
- **AND** AGENTS.md itself is modified by this change in no way

### Requirement: DE-004 evidence for intent-level rules

Per DE-004, the change MUST record before/after line and token
counts for both edited files in a metrics artifact under the
change directory, following the `command-prose-pilot`
`metrics.md` precedent.

#### Scenario: Measured deltas recorded

- **GIVEN** the change lands
- **WHEN** the change's metrics artifact is read
- **THEN** before/after line counts and token counts appear for
  `.opencode/uf/packs/determinism.md` and
  `.opencode/skills/determinism-first/SKILL.md`

### Requirement: Cross-layer wording consistency

MUST-rule wording MUST stay aligned across the pack and skill
layers. "Aligned" means: the DE-005 core clause ("a fixed
sequence of tool calls with no judgment between steps — each
next call and its arguments fully determined by the previous
call's structured result") is verbatim-identical in both
layers (sentence-initial capitalization aside); RFC 2119
markers are preserved wherever a rule is restated; and
neither layer softens the other with qualifiers. The spec
review of this change MUST include an explicit cross-layer
wording diff of the intent-level collapse language before
implementation is marked complete.

#### Scenario: Wording diffed at review

- **GIVEN** the edited pack and skill
- **WHEN** spec review runs
- **THEN** the collapse-rule wording is compared across layers
  against the verbatim-core alignment criterion
- **AND** any divergence in the core clause, markers, or
  qualifiers is resolved before completion

### Requirement: Change record for intent-level rules

The change MUST record the added rules in `CHANGELOG.md` per the
AGENTS.md documentation gate, covering DE-005 and DE-006, the
pack version bump, and the skill extension.

#### Scenario: CHANGELOG entry present

- **GIVEN** the change lands
- **WHEN** `CHANGELOG.md` is read
- **THEN** an entry describes DE-005/DE-006, the pack v1.1.0
  bump, and the skill chain-collapse guidance
