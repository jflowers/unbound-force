## ADDED Requirements

### Requirement: Planner error remediation

When plan creation fails or returns INCONCLUSIVE, the planner's
error output MUST include actionable remediation: the missing
or invalid entity, the configuration file and entry that must
be repaired, and the lists of discovered versus eligible
reviewers that produced the mismatch. A bare "no entry found"
error without repair context MUST NOT be emitted.

#### Scenario: Reviewer missing from capabilities file

- **GIVEN** an agent file `.opencode/agents/divisor-X.md`
  exists but `.uf/reviewer-capabilities.yaml` has no
  `divisor-X` entry, and plan creation fails closed
- **WHEN** the planner returns its error
- **THEN** the error names `divisor-X`, points to
  `.uf/reviewer-capabilities.yaml` as the file to repair, and
  lists which discovered agents are missing eligibility data

### Requirement: Reviewer discovery and eligibility consistency

Before producing a dispatch plan, the planner MUST cross-check
the discovered reviewer agents against the eligibility
configuration (`.uf/reviewer-capabilities.yaml`) and include
the comparison in the plan result. Discovered agents without
eligibility data MUST fail the plan with the remediation error
above; eligibility entries without a discovered agent file
MUST be reported as a warning in the plan result.

#### Scenario: Drift between agents directory and capabilities

- **GIVEN** the agents directory contains `divisor-X.md` while
  the capabilities file does not list `divisor-X`
- **WHEN** the planner builds a plan that would include
  `divisor-X`
- **THEN** the plan fails closed with an error naming the file
  to repair, instead of an unexplained INCONCLUSIVE

#### Scenario: Stale capabilities entry

- **GIVEN** the capabilities file lists `divisor-Y` but no
  `.opencode/agents/divisor-Y.md` exists
- **WHEN** the planner builds a plan that does not require
  `divisor-Y`
- **THEN** the plan succeeds and carries a warning identifying
  the stale entry
