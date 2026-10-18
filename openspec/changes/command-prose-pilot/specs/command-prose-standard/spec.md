# Command Prose Standard Specification

## ADDED Requirements

### Requirement: Canonical Control Verbs

Instruction prose in agent command files MUST direct
control flow using only these canonical verbs, each with
one fixed meaning:

- **STOP** — halt immediately, report the reason, and
  return control to the user; only a user action resumes
  execution.
- **EXIT** — end the command through the named exit
  variant; an EXIT is an expected outcome, not a failure.
- **PROCEED** — continue at the named target; used only
  when the next action is not simply the following item.
- **RELAY** — pause, return a structured value to the
  orchestrator, and stay resumable; used for human gates.
- **RESUME** — continue from the named authoritative state
  source (todowrite, checkpoints, or disk), never from
  inferred context.
- **SKIP** — omit the named item and continue; permitted
  only when a documented condition allows it, and always
  reported.
- **DELEGATE** — spawn a fresh subagent for the named
  command or task, name the expected artifact, and wait
  for the return.
- **ANNOUNCE** — present information composed by judgment;
  tool-rendered output MUST NOT be reconstructed from
  prose.
- **ASK** — request one decision through the question
  tool, stating the question and the options.
- **VERIFY** — execute the named check and follow the
  named pass and fail branches.

The tokens "abort", "halt", "terminate", "terminalize",
and "bail" MUST NOT direct control flow. The phrase "exit
path" MUST NOT be used; the named EXIT variant MUST be
named instead. Non-glossary verbs MAY describe behavior
but MUST NOT direct control flow.

#### Scenario: Ban-list tokens direct nothing

- **GIVEN** a command file rewritten under this standard
- **WHEN** `rg -in '\b(abort|halt|terminate|terminalize|bail)\b'`
  runs against the file
- **THEN** the scan MUST return no matches

#### Scenario: Pause-and-return uses RELAY

- **GIVEN** a subagent reaches a mandatory human gate
- **WHEN** the instruction states what the subagent does
- **THEN** it MUST use RELAY and MUST NOT use STOP,
  because STOP means halt-and-return-control-to-user

### Requirement: Reference by Name

A cross-reference MUST contain the target's name when it
names a step, section, phase, or sibling command. A bare
number, such as "step 5", MUST NOT be the only
identifier. Numbers MAY accompany a name at the
definition site of the numbered item.

#### Scenario: Cross-command step reference

- **GIVEN** an instruction references a step of another
  command
- **WHEN** the reference is written
- **THEN** it MUST name the target, as in "the Code
  Review step of /uf.unleash"

#### Scenario: Definition site may carry a number

- **GIVEN** a document defines "Phase 0 — Input
  Resolution"
- **WHEN** later text references that phase
- **THEN** the reference MUST include the phase name and
  MAY also include the number

### Requirement: Single Numbering Axis

A command file MUST carry one numbering axis for its
primary flow. Supplementary axes, such as phase numbers
inside a nested protocol, MUST use labels distinct from
the primary axis, and every reference to an item on any
axis MUST include the item name.

#### Scenario: Axes do not collide

- **GIVEN** a command has both markdown sections and
  pipeline steps
- **WHEN** both axes exist
- **THEN** the axes use distinct labels
- **AND** no reference resolves to two different items
  depending on the axis a reader assumes

### Requirement: Sentence and Step Limits

Procedural sentences in Instructions sections MUST be at
most 20 words; longer sentences MUST be split or moved
into a decision table. Each numbered step MUST contain
exactly one action. Descriptive sections are exempt from
the word limit.

#### Scenario: Sentence length check

- **GIVEN** a command file rewritten under this standard
- **WHEN** sentences in Instructions sections are counted
- **THEN** no procedural sentence exceeds 20 words

#### Scenario: One action per step

- **GIVEN** a numbered procedural step in a rewritten
  file
- **WHEN** the step is parsed
- **THEN** it contains one action: one glossary verb or
  one tool invocation

### Requirement: Decision Tables for Branching

A conditional with three or more outcomes MUST be
expressed as a decision table with condition columns and
one outcome column. A two-outcome conditional MAY remain
inline but MUST state both outcomes. Nested conditional
prose MUST NOT be used.

#### Scenario: Three-outcome branch becomes a table

- **GIVEN** a verdict has three values: approve, request
  changes, inconclusive
- **WHEN** the instruction describes what to do per
  verdict
- **THEN** it MUST be a decision table keyed on the
  verdict
- **AND** each row MUST state its outcome with a
  glossary verb

#### Scenario: No nested conditional prose

- **GIVEN** a command file rewritten under this standard
- **WHEN** a reviewer inspects its branching logic
- **THEN** no conditional appears inside another
  conditional

### Requirement: Step Template

Each numbered procedural step MUST follow the template:
Action, one sentence with one glossary verb or tool call;
On failure, required when the action can fail, usually
STOP with the reason or a named fallback; and Next,
required when the following item is not simply the next
number.

#### Scenario: Fallible step states failure handling

- **GIVEN** a step invokes a fallible command such as
  `gh issue view`
- **WHEN** the step is written
- **THEN** it MUST state an On-failure branch
- **AND** the branch MUST use a glossary verb

### Requirement: Tool-Owned Output Shapes

Instruction prose MUST NOT reproduce or paraphrase a
rendered output shape where an executable tool owns the
format; this defers to determinism rule DE-003. Up to
two examples MAY remain near a consuming decision
point, per DE-002.

#### Scenario: No new rendered-shape previews

- **GIVEN** a command file before and after a conformance
  rewrite
- **WHEN** the two versions are compared
- **THEN** the rewrite adds no new rendered-output
  previews

### Requirement: Normativity Style

Normative force MUST be carried by RFC 2119 keywords
(MUST, MUST NOT, SHOULD, MAY). ALL-CAPS is reserved for
RFC 2119 keywords, glossary control verbs and their
inflected forms, tool names, code, and paths. Words
capitalized for urgency MUST be rewritten to carry their
force through MUST or MUST NOT.

#### Scenario: ALL-CAPS inventory is constrained

- **GIVEN** a command file rewritten under this standard
- **WHEN** its all-caps words are enumerated
- **THEN** every one is an RFC 2119 keyword, a glossary
  control verb, a tool name, code, or a path

### Requirement: Boilerplate Defined Once

A boilerplate block — a guard or protocol repeated
across commands — MUST be defined once in its owning
document and referenced by name from other documents.
Within one command file, a repeated block MUST appear
once; other mentions MUST reference it by name.
Cross-command deduplication is out of scope for the
pilot and is handled opportunistically in later
rollout changes.

#### Scenario: Session-resume guard defined once

- **GIVEN** a command needs a session-resume guard
- **WHEN** the command file is written
- **THEN** the guard text appears once
- **AND** any other mention references the guard by name

### Requirement: Change-Time Validation Only

Conformance MUST be validated with executable `rg`
checks at change time, with results recorded in the
change record. No CI gate, lint rule, or test asserting
prose conformance MAY be added; gate changes are
reserved by the repo gatekeeping rule.

#### Scenario: rg checks run at change time

- **GIVEN** a command rewrite under this standard
- **WHEN** the change is validated
- **THEN** ban-list and bare-number checks are executed
  and their results recorded in the change record
- **AND** the change adds no CI workflow or gate file

### Requirement: Measurable Conformance Evidence

Every conformance rewrite MUST record before-and-after
static metrics in its change record: line count, word
count, procedural sentences over 20 words, ban-list
tokens, bare-number references, and maximum nesting
depth. This satisfies determinism rule DE-004.

#### Scenario: Metrics recorded for a rewrite

- **GIVEN** a conformance rewrite of a command file
- **WHEN** the change record is written
- **THEN** it contains all six metrics with before and
  after values
