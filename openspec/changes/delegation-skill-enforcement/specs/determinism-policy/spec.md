## ADDED Requirements

### Requirement: Pack MUST rule DE-008 — delegation skill enforcement

The determinism convention pack MUST define DE-008 [MUST]:
work delegated through the command delegation tool and
classified as deterministic MUST carry a skill or script
reference verified to exist, or a substantive recorded
absence reason (one that states what was searched for or
what was found);
command, agent, and skill instruction that delegates work MUST
bind mechanical work to repo tooling through the tool's
parameter contract (`task_classification`, `skill`,
`skill_absent_reason`), not through prose-only skill
instructions. The pack's severity mapping MUST list DE-008
among the MUST rules whose violations are CRITICAL findings.

#### Scenario: Rule present with MUST marker

- **GIVEN** the determinism pack at
  `.opencode/uf/packs/determinism.md`
- **WHEN** its rules are read
- **THEN** DE-008 carries a `[MUST]` marker and names the
  parameter contract

#### Scenario: Severity mapping covers DE-008

- **GIVEN** the pack's severity-mapping paragraph
- **WHEN** the MUST rule list is enumerated
- **THEN** DE-008 appears alongside DE-001, DE-003, DE-005,
  and DE-007 as a CRITICAL-severity rule

### Requirement: Pack version bump for the delegation rule

The pack version MUST bump 1.2.0 → 1.3.0 (MINOR: new rule)
when DE-008 lands, and the severity-mapping paragraph MUST be
updated in the same edit.

#### Scenario: Version reads 1.3.0

- **GIVEN** the pack frontmatter
- **WHEN** the version field is read after the change lands
- **THEN** it reads `1.3.0`

### Requirement: Determinism-first skill delegation guidance

The determinism-first skill MUST instruct agents that
delegated work carries its classification: when delegating
work classified as deterministic, the delegation MUST declare
`task_classification` and pass a verified skill or script
reference (or record why none exists) through the command
delegation tool's parameters. The skill's Related Enforcement
section MUST reference DE-008 and the parameter contract so
the classification rubric and the enforcement mechanism point
at each other.

#### Scenario: Body guidance references the contract

- **GIVEN** `.opencode/skills/determinism-first/SKILL.md`
- **WHEN** the body is read
- **THEN** delegation guidance names `task_classification`,
  `skill`, and `skill_absent_reason`

#### Scenario: Related Enforcement lists DE-008

- **GIVEN** the skill's Related Enforcement section
- **WHEN** its entries are read
- **THEN** DE-008 and the enforcement parameter contract are
  listed alongside the existing Principle VI, AGENTS.md, and
  DE-001 through DE-007 references

### Requirement: Guard reviewer enforcement of DE-008

The Guard reviewer agent's Code Review Mode checklist MUST
include a deterministic-delegation check enforcing DE-008's
rule: flag new or modified delegation instruction that binds
mechanical work to skills via prose only (instead of the
parameter contract), and flag deterministic-classified
delegations -- `uf_delegate_command` calls and Swarm-path
spawn prompts alike -- that carry no skill reference and no
recorded absence reason, and flag vacuous recorded reasons
(a reason that does not state what was searched for or what
was found). The check MUST be self-describing
(it names the parameter contract and cites no repo-local pack
rule, because the agent definition is scaffold-embedded) and
MUST appear in the checklist the review prompt assembly
reads from the agent definition, requiring no plugin changes.

#### Scenario: Checklist section present

- **GIVEN** `.opencode/agents/divisor-guard.md` in Code
  Review Mode
- **WHEN** the review checklist is enumerated
- **THEN** a deterministic-delegation section exists, is
  self-describing, and names the parameter contract

#### Scenario: Check reaches review prompts

- **GIVEN** `build_review_prompts` assembles a Guard review
  prompt from the agent definition
- **WHEN** the prompt is built
- **THEN** the deterministic-delegation check is included with
  no plugin code changes required

#### Scenario: Prose-only skill binding is flagged

- **GIVEN** a diff adds delegation instruction that requires
  skill usage in prompt prose without the parameter contract
- **WHEN** the Guard reviews the change
- **THEN** it produces a finding naming the
  deterministic-delegation violation

#### Scenario: Vacuous absence reason is flagged

- **GIVEN** a deterministic delegation records
  `skill_absent_reason: "n/a"` in its checkpoint data
- **WHEN** the Guard audits the delegation
- **THEN** it produces a finding naming the vacuous absence
  reason as a deterministic-delegation violation

#### Scenario: Substantive absence reason passes

- **GIVEN** a deterministic delegation records
  `skill_absent_reason: "no repo skill or script ships
  tooling for this procedure; searched .opencode/skills/,
  .opencode/skill/, and .specify/scripts/bash/"`
- **WHEN** the Guard audits the delegation
- **THEN** no deterministic-delegation finding is raised for
  the recorded reason

### Requirement: Change record for the delegation rule

The change MUST record the enforcement mechanism in
`CHANGELOG.md` per the AGENTS.md documentation gate, covering
the tool contract, DE-008, the skill and Guard updates, and
the command template change.

#### Scenario: CHANGELOG entry present

- **GIVEN** the change lands
- **WHEN** `CHANGELOG.md` is read
- **THEN** an entry describes the delegation skill enforcement
  across the tool, pack, skill, Guard, and template layers
