# unleash Interactive Clarify Ask Gate

Parent: the clarify exit is the Speckit tier's primary human
interaction, so every question Dewey cannot answer should reach
the human directly instead of ejecting the pipeline and
requiring a manual spec edit plus a full re-run (user report
2026-10-26).

## ADDED Requirements

### Requirement: Interactive clarify ask gate

`/uf.unleash` Step 1 (Speckit) MUST ask the human every
clarification question that Dewey could not answer, through the
question tool, before taking the clarify exit. The gate:

- MUST deliver exactly one question per question tool call;
  questions MUST NOT be batched into a single call, and the
  next question MUST NOT be presented until the previous
  question's response is received;
- MUST carry the question text and its surrounding context
  (the context lines the scan returned) in the ask;
- SHOULD formulate two to five mutually exclusive answer
  options from the question's own enumerated alternatives when
  the question text enumerates them, and MUST list the spec's
  stated working default first, labeled "(Recommended)", when
  one is stated;
- MUST enable a custom free-form answer option;
- MUST offer a defer option that leaves the question on the
  unanswerable list instead of resolving it;
- MUST resolve a human answer through `resolve_clarification`
  with `resolved_by` "human", producing the same spec.md
  artifacts as a silent auto-resolution;
- MUST fall back to the unanswerable list — and the existing
  clarify exit — when the question tool is unavailable;
- MUST NOT cap the number of questions asked: every scanned
  question MUST be resolved or deferred before Step 1
  completes;
- MUST announce, after processing, the counts of auto-resolved,
  human-answered, and deferred questions.

The ask gate is required human input within Step 1 — the same
class of mid-pipeline interaction as the per-finding spec
review decision gate in Step 4 — not a pause between pipeline
steps. Questions Dewey answered MUST continue to auto-resolve
silently without human confirmation. Deferred questions MUST
flow into the rendered clarify exit template unchanged.

#### Scenario: Interactive resolution round-trip

- **GIVEN** spec.md carries one question Dewey cannot answer
- **WHEN** Step 1 processes it
- **THEN** the command asks the human through a single question tool call carrying the question and its spec context, and the human's answer is applied by `resolve_clarification` with `resolved_by` "human" — marker removed, answer inserted inline, Clarifications entry appended — and the pipeline proceeds to Step 2 in the same run

#### Scenario: Recommended option from the working default

- **GIVEN** a question enumerates alternatives ("JSON null, an empty string, or the key omitted") and the spec states a working default
- **WHEN** the ask gate presents it
- **THEN** the options are those enumerated alternatives with the working default first and labeled "(Recommended)", and a custom free-form answer is enabled

#### Scenario: Defer routes to the exit

- **GIVEN** the human defers a question at the ask gate
- **WHEN** Step 1 finishes processing
- **THEN** the deferred question remains on the unanswerable list and the pipeline exits through the rendered clarify template carrying that question, exactly as before

#### Scenario: Question tool unavailable

- **GIVEN** the question tool is not available in the session
- **WHEN** Step 1 has questions Dewey could not answer
- **THEN** no ask is attempted; the questions flow to the unanswerable list and the pipeline exits through the rendered clarify template

#### Scenario: Dewey unavailable becomes interactive

- **GIVEN** Dewey tools are not available in the session but the question tool is
- **WHEN** Step 1 processes markers
- **THEN** the questions are asked through the ask gate rather than collected as unanswerable

#### Scenario: Counts announced

- **GIVEN** a Step 1 run resolves two questions via Dewey, one via the ask gate, and one is deferred
- **WHEN** processing completes
- **THEN** the command announces the auto-resolved, human-answered, and deferred counts before proceeding or exiting

## MODIFIED Requirements

### Requirement: Clarification mechanics tools

`/uf.unleash` Step 1 (Speckit) MUST use `scan_clarifications`
to extract `[NEEDS CLARIFICATION]` markers in the superset
forms defined by the Single-sourced clarification marker grammar
requirement, with surrounding context from spec.md, and
`resolve_clarification` to apply a resolution: remove the
marker, insert the answer inline, and append the
`- Q: ... -> A: ...` entry to `## Clarifications`, creating the
section when absent, carrying the resolution's provenance —
`(Dewey-resolved from ...)` for silent auto-resolutions and
`(human-answered during /uf.unleash clarify)` for ask-gate
answers. The `resolved_by` input ("dewey" | "human", default
"dewey") MUST be validated conditionally, fail-closed at the
schema level: `source` is required when `resolved_by` is "dewey"
or omitted, and MUST be omitted when `resolved_by` is "human".
`resolve_clarification` MUST locate the target marker
by comparing its extracted question — computed by the same
helper the scan uses — against the question exactly as scanned,
for every grammar form. The command prose MUST retain query
formulation, result evaluation, and answer-sufficiency
judgment; for bare-marker and empty-colon questions (whose
question text is the raw marker or its empty-colon fallback)
query formulation MUST use the surrounding context rather than
the raw marker text. Silent auto-resolution without human
confirmation MUST be preserved. The routing of questions Dewey
cannot answer — including the Dewey-unavailable and
question-tool-unavailable populations — is owned by the
Interactive clarify ask gate requirement.

Previously: the requirement routed every Dewey-unanswerable
question directly into the rendered exit template, and a
Dewey-unavailable session collected all questions as
unanswerable and exited; the human edited spec.md by hand and
re-ran the pipeline. This change moves that routing wholly
into the Interactive clarify ask gate requirement — deleting
the routing sentence and the Dewey-unavailable scenario here —
so the merged capability states the routing once.

#### Scenario: Marker scan

- **GIVEN** spec.md contains two `[NEEDS CLARIFICATION: ...]` markers
- **WHEN** `scan_clarifications` runs against the feature directory
- **THEN** it returns each question with its surrounding context lines

#### Scenario: Bare marker resolution round-trip

- **GIVEN** `scan_clarifications` returns a bare-marker question whose text is the raw marker
- **WHEN** `resolve_clarification` runs with that question and an answer
- **THEN** the bare marker is removed from spec.md, the answer is inserted inline, and the `Q: -> A:` entry is appended to `## Clarifications` under that question text

#### Scenario: Resolution applied

- **GIVEN** a resolved question with its answer and Dewey source
- **WHEN** `resolve_clarification` runs
- **THEN** the marker is removed from spec.md, the answer is inserted inline, and the `Q: -> A:` entry is appended to `## Clarifications`

#### Scenario: Human provenance rendering

- **GIVEN** one question resolved by Dewey from page X and another answered at the ask gate
- **WHEN** `resolve_clarification` applies both resolutions
- **THEN** the first Clarifications entry ends `(Dewey-resolved from X)` and the second ends `(human-answered during /uf.unleash clarify)`

#### Scenario: Conditional source validation

- **GIVEN** a resolve_clarification call with `resolved_by` "human" and a `source` supplied
- **WHEN** the input is validated
- **THEN** the call is rejected (provenance honesty, fail-closed); a call with `resolved_by` "dewey" or omitted and no `source` is rejected the same way, while both valid combinations are accepted

### Requirement: Guardrail consistency

The `/uf.unleash` guardrails MUST name the two legitimate
mid-pipeline human interactions, amending the "never pause between
steps" rule: the interactive clarify ask gate in Step 1 (Speckit)
and the spec auto-fix consent gate in Step 4. The guardrails MUST
retain: never run on `main`, never skip the spec review exit on
HIGH/CRITICAL findings, and actionable exit messages. Prescribed
exit and demo output MUST be rendered by the formatter tools rather
than reconstructed from prose; the OUTPUT FIDELITY GUARD and
re-read instructions MUST NOT remain in the command.

Previously: the guardrails named the spec auto-fix consent gate as
the single legitimate mid-pipeline human interaction; the Step 1
ask gate did not exist, and unanswerable clarify questions exited
the pipeline for a manual spec edit instead of being asked.

#### Scenario: Guardrails name both gates and the renderers

- **GIVEN** the updated `uf.unleash.md` guardrails section
- **WHEN** a reader searches for the pause prohibition and the demo-output rule
- **THEN** both gate exceptions — the Step 1 clarify ask gate and the Step 4 consent gate — are stated explicitly and demo/exit output is prescribed as tool-rendered, with no OUTPUT FIDELITY GUARD present
