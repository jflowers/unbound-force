# Run-Pipeline-Plan Prose Conformance Specification

## ADDED Requirements

### Requirement: Command File Conformance

The rewritten `uf.run-pipeline-plan.md` MUST conform to
the `command-prose-standard` capability: canonical
control verbs only, reference by name, a single numbering
axis, sentence and step limits, decision tables for
branching, the step template, and no new rendered-shape
previews.

#### Scenario: Ban-list scan is clean

- **GIVEN** the rewritten command file
- **WHEN** `rg -in '\b(abort|halt|terminate|terminalize|bail)\b' .opencode/commands/uf.run-pipeline-plan.md` runs
- **THEN** the scan MUST return no matches

#### Scenario: Procedural sentences within limit

- **GIVEN** the rewritten command file
- **WHEN** sentences in its Instructions sections are
  counted
- **THEN** none exceeds 20 words

### Requirement: Behavioral Contract Preservation

The rewrite MUST preserve every externally observable
behavior of the command: input detection (file path
versus issue refs), Phase 0 resolution and confirmation,
the three-subagent per-item pipeline (/opsx-propose,
/uf.unleash OpenSpec mode, /uf.finale), disk handoff
verification, clean tree between items, the Gate Relay
Protocol, all guardrails, and todowrite tracking
completion rules. The frontmatter description, the
scaffold marker comment, and the `<protect>` block
boundaries MUST be preserved unchanged.

#### Scenario: Three-subagent fanout preserved

- **GIVEN** the rewritten command file
- **WHEN** its Per-Item Pipeline Protocol is inspected
- **THEN** each work item still runs three fresh general
  subagents in sequence: /opsx-propose, /uf.unleash in
  OpenSpec mode, /uf.finale

#### Scenario: Gate relay semantics preserved

- **GIVEN** the rewritten Gate Relay Protocol
- **WHEN** a subagent reaches a human gate
- **THEN** it still returns a structured GATE value
- **AND** the orchestrator still invokes the question
  tool and resumes the same subagent via task_id

#### Scenario: Tracking completion rule preserved

- **GIVEN** the rewritten Tracking rules
- **WHEN** a todowrite entry is considered for completion
- **THEN** it is still complete only after the item's PR
  is created AND its CI is green

#### Scenario: Structural invariants preserved

- **GIVEN** the rewritten command file
- **WHEN** compared with the pre-rewrite version
- **THEN** the frontmatter description, the scaffold
  marker comment, and both `<protect>` boundaries are
  unchanged

### Requirement: Cross-Command Reference Correction

The current text "Step 8 (code review) MUST NOT be
skipped" is a defect: in /uf.unleash step numbering, code
review is Step 6 and Step 8 is Demo. The rewrite MUST
replace it with a name-based reference to the Code Review
step of /uf.unleash, preserving the rule that the review
council MUST NOT be skipped.

#### Scenario: Name-based reference replaces the number

- **GIVEN** the rewritten command file
- **WHEN** `rg -n 'Step 8' .opencode/commands/uf.run-pipeline-plan.md` runs
- **THEN** the scan MUST return no matches
- **AND** the no-skip rule for the Code Review step of
  /uf.unleash remains, referenced by name

### Requirement: Gate Relay Verb Correction

The Gate Relay Protocol currently reads "MUST STOP
execution and return" a structured value. STOP means
halt-and-return-control-to-user; the intended behavior
is pause-and-stay-resumable. The rewrite MUST use the
RELAY verb for this action.

#### Scenario: RELAY replaces STOP in the Gate Relay

- **GIVEN** the rewritten Gate Relay Protocol
- **WHEN** its control verbs are inspected
- **THEN** the subagent instruction uses RELAY
- **AND** STOP does not appear in the Gate Relay
  Protocol

### Requirement: Session-Resume Guard Recast

The rewrite MUST recast the session-resume guard as a
precondition. The guard currently reads "STOP and
re-read this entire template before continuing"; the
intended behavior is a precondition on resuming, not a
halt. The recast reads "Before continuing, re-read this
entire template", keeping the rule that resumability is
determined only by todowrite entries and disk state.

#### Scenario: Guard states a precondition

- **GIVEN** the rewritten command file
- **WHEN** its session-resume guard is inspected
- **THEN** it directs the reader to re-read the template
  before continuing
- **AND** it does not use STOP
- **AND** todowrite entries and disk state remain the
  only authoritative resumability sources

### Requirement: Dual-Copy Byte Identity

The rewrite MUST update `.opencode/commands/uf.run-pipeline-plan.md`
and `internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md`
atomically, and the two files MUST remain byte-identical.

#### Scenario: Drift test passes

- **GIVEN** both copies are rewritten
- **WHEN** `make test` runs
- **THEN** `TestEmbeddedAssets_MatchSource` MUST pass

#### Scenario: Files are identical

- **GIVEN** both copies are rewritten
- **WHEN** `cmp .opencode/commands/uf.run-pipeline-plan.md internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md` runs
- **THEN** it MUST report no difference

### Requirement: Measured Rewrite Delta

The change record MUST contain before-and-after static
metrics for the rewrite — lines, words, over-limit
procedural sentences, ban-list tokens, bare-number
references, and maximum nesting depth — satisfying
determinism rule DE-004.

#### Scenario: Metrics in the change record

- **GIVEN** the rewrite is complete
- **WHEN** the change record is reviewed
- **THEN** all six metrics appear with before and after
  values
