## Context

`.opencode/commands/` holds 32 slash commands (~10,600 lines,
~57,000 words). They are tool-owned scaffolded assets: each
command has a byte-identical mirror under
`internal/scaffold/assets/opencode/commands/`, enforced by
`TestEmbeddedAssets_MatchSource`. Commands are the primary
medium through which human intent reaches agents.

An audit (session record, 2026-10) found agent confusion is
structural. Ranked causes: numbering collisions, control
flow as prose, cross-file normative references, terminology
drift, boilerplate accretion, and state variables held
across context compressions. ASD-STE100 was evaluated and
rejected for literal adoption (aerospace dictionary for
human non-native speakers; the failure modes here are
ambiguity, contradiction, and state tracking). Its
disciplines are adapted instead.

`uf.run-pipeline-plan.md` (225 lines, ~1,000 words) is the
pilot. It exhibits every confusion class in miniature: a
propagated cross-command numbering defect (line 132: "Step 8
(code review)" — code review is Step 6 in uf.unleash step
numbering), a STOP semantics collision (Gate Relay STOP
means pause-and-return; uf.unleash STOP means halt), prose
state machines (Phase 0 input resolution, Gate Relay), and
guardrails duplicated from AGENTS.md.

This design doubles as the draft house standard. Phase 2
(a separate change) promotes the validated standard to a
repo-local skill + convention pack pair, following the
determinism precedent
(`.opencode/skills/determinism-first/SKILL.md` +
`.opencode/uf/packs/determinism.md`).

## Goals / Non-Goals

### Goals
- Define the house prose standard for agent instruction
  files, precise enough to validate mechanically where
  possible.
- Rewrite both copies of `uf.run-pipeline-plan.md` to
  conform, preserving the behavioral contract exactly.
- Produce measurable before/after evidence (DE-004) and
  comprehension evidence from fresh-session A/B testing.
- Leave the standard ready for phase-2 promotion.

### Non-Goals
- Rewriting any other command (phase 3, one change each).
- Creating the skill or convention pack (phase 2).
- Extracting mechanical procedures into tools (Principle VI
  workstream; the pilot rewrites prose form only).
- Adding any CI gate or modifying existing gates
  (gatekeeping rule).
- Changing plugin or runtime behavior.

## Decisions

### D1 — The standard lives in this change during the pilot

The rulebook is this document. It is validated by applying
it once, under review, before it is promoted to permanent
homes (phase 2). This mirrors how the determinism rules were
drafted inside their change before codification.

### D2 — Canonical verb glossary

Control-flow meaning is carried ONLY by glossary verbs.
Each glossary verb has exactly one meaning across the whole
corpus. The pilot's initial set is ten verbs (the eight
assessed in the audit plus RELAY and ASK, added because
RELAY is required to resolve the STOP collision and ASK
names the corpus's most frequent interaction):

- **STOP** — Halt the current command immediately. Report
  the reason. Take no further action. Control returns to
  the user. Resumption requires explicit user action.
- **EXIT** — Terminate the command through a named exit
  variant. Emit that variant's exit message. EXIT variants
  are expected outcomes (pause points), not failures.
- **PROCEED** — Continue execution at the named target
  (step, phase, or command). Used only for non-sequential
  continuation; plain list order needs no PROCEED.
- **RELAY** — Subagent to orchestrator: pause execution and
  return a structured value. The subagent remains
  resumable via its `task_id`. Used for human confirmation
  gates.
- **RESUME** — Continue an interrupted execution from the
  named authoritative state source (`todowrite` entries,
  checkpoints, disk artifacts). Never infer state from
  compressed context.
- **SKIP** — Omit the named step or item and continue.
  Legal only where a documented condition permits. Every
  SKIP MUST be reported.
- **DELEGATE** — Spawn a fresh subagent to execute the
  named command or task. Name the expected artifact. Wait
  for the return value.
- **ANNOUNCE** — Present judgment-composed information to
  the user. Prescribed output formats are tool-rendered
  (DE-003) and are never reconstructed from prose.
- **ASK** — Request one decision from the user via the
  `question` tool. State the question and the options.
- **VERIFY** — Execute the named check. Follow the named
  pass branch on success and the named fail branch on
  failure. Both branches MUST be stated.

Ban list — the tokens `abort`, `halt`, `terminate`,
`terminalize`, and `bail` MUST NOT appear as control verbs,
and the noun phrase `exit path` MUST NOT appear (name the
EXIT variant instead). Non-glossary verbs MAY describe
actions but MUST NOT direct control flow.

### D3 — Reference by name

A cross-reference MUST contain its target's name: the step
name, phase name, command name, or tool name. A bare number
is not a reference. "Step 8 (code review)" is invalid;
"the Code Review step of uf.unleash" is valid. Numbers MAY
accompany names at the definition site ("Phase 0 — Input
Resolution") and in references that also carry the name.

### D4 — One numbering scheme per document

A command file MUST use one numbered procedure axis.
Supplementary axes MUST use distinct labels (for example
Phase N versus Step N), and every reference to a numbered
item MUST include the item's name (D3). This removes the
three-scheme collision documented in uf.unleash; that
command's cleanup is phase 3 work.

### D5 — Sentence and step size limits

A procedural sentence (text directing agent action in an
Instructions section) MUST be 20 words or fewer. Longer
content MUST be split into multiple steps or moved into a
decision table (D6). A numbered step MUST contain exactly
one action. Descriptive sections (Description, Usage) are
exempt but SHOULD stay concise.

### D6 — Decision tables for branching logic

A decision with three or more outcomes MUST be a table: one
row per condition combination, one column for conditions,
one column for outcomes. A two-outcome decision MAY remain
inline but MUST state both outcomes. Nested conditional
prose (a conditional inside a conditional) MUST NOT appear.

### D7 — Fixed step template

Each numbered step in a procedure MUST provide:

- **Action** — one sentence, one glossary verb or tool
  invocation, 20 words or fewer.
- **On failure** — required whenever the action can fail;
  names the handling (commonly STOP with the reason, or a
  named fallback).
- **Next** — required whenever continuation is not simply
  the following list item; names the target.

### D8 — Output shapes belong to tools

Where a tool owns an output format, instruction prose MUST
NOT reproduce or paraphrase the shape; it MUST reference the
tool. This defers to DE-003 (prescribed output MUST be
tool-rendered). DE-002 permits preserving one or two
tool-output examples near the decision points that consume
them; the pilot adds no new examples.

### D9 — Normativity style

RFC 2119 keywords (MUST, MUST NOT, SHOULD, MAY) carry
normative force. ALL-CAPS is reserved for RFC 2119
keywords, glossary control verbs and their inflected
forms, tool names, code identifiers, and paths. Urgency
emphasis ("Do NOT forget") MUST be rewritten as a MUST or
MUST NOT rule.

### D10 — Boilerplate defined once

A block repeated across commands (session-resume guard,
tracking protocol) MUST be defined once in its owning
document and referenced by name from other documents. The
pilot keeps per-command boilerplate in place; cross-command
deduplication happens opportunistically during phase 3
migration, matching the determinism pack's
opportunistic-migration precedent.

### D11 — Conformance validation, not a CI gate

The standard is validated with `rg`-based checks run at
change time (this change and future command-changing
reviews). No CI gate is added; existing gates are untouched.
This respects the AGENTS.md gatekeeping rule and keeps the
standard's enforcement review-time and authoring-time, not
build-time.

### D12 — Semantic preservation contract for the rewrite

The rewrite MUST preserve: the frontmatter description, the
scaffold marker comment, the `<protect>` block boundaries,
and every externally observable behavior (inputs accepted,
subagents spawned, gates relayed, artifacts verified, PR
rules, tracking rules). Three prose defects are corrected
to the behavior the corpus evidences as intended:

1. Line 132 "Step 8 (code review) MUST NOT be skipped"
   becomes a reference to the Code Review step of
   uf.unleash (step 6 in its numbering; the number was
   wrong, the intent unambiguous).
2. The Gate Relay's "MUST STOP execution and return a
   structured value" becomes RELAY (D2), leaving STOP with
   one meaning.
3. The session-resume guard's "STOP and re-read this entire
   template" is recast as a precondition ("Before
   continuing, re-read this entire template") — nothing
   executes before the re-read, as intended.

### D13 — Measurement

Static metrics are captured before and after and recorded
in the change record (DE-004): line count, word count,
procedural sentences over 20 words, ban-list token count,
bare-number reference count, maximum nesting depth.
Comprehension is measured by A/B testing: two fixed
scenarios (a plan file containing an [INVESTIGATION] item;
a mid-gate interruption), a gold answer key derived from
the behavioral contract, three to five fresh sessions per
version, scores reported in the retrospective.

### D14 — Worked example (Gate Relay, before and after)

Before (current prose):

> When a subagent encounters a mandatory human confirmation
> gate, it MUST STOP execution and return a structured
> value to the orchestrator: `GATE:<name>` ... The
> orchestrator then: 1. Receives the `GATE:` return value
> 2. Invokes the `question` tool ... 3. After the human
> responds, resumes the SAME subagent via `task_id` with
> the human's answer.

After (standard-conforming):

> **RELAY protocol**
>
> | Subagent reaches a confirmation gate | Action |
> |---|---|
> | Gate requires human confirmation | RELAY `GATE:<name>`, question, findings, options |
> | Gate does not require confirmation | PROCEED |
>
> 1. **Action**: Orchestrator ASKs the question with the
>    relayed options. **On failure**: none (question tool
>    blocks until answered).
> 2. **Action**: Orchestrator RESUMEs the same subagent
>    via `task_id` with the human's answer.

## Risks / Trade-offs

- **Glossary incompleteness** — other commands may need
  verbs outside the initial ten. Accepted: the pilot
  validates the mechanism; phase 2 extends the glossary
  before promotion.
- **Behavioral drift during rewrite** — the highest risk.
  Mitigated by the D12 preservation contract, the spec
  review council acting as semantic-preservation reviewer,
  and the A/B comprehension check.
- **20-word limit fragmenting complex conditions** —
  accepted; decision tables absorb the complexity.
- **rg checks are heuristic** — bare-number detection in
  particular needs human confirmation. Accepted because
  checks are validation aids, not gates (D11).
- **Small A/B sample** — three to five sessions is
  directional evidence, not statistical proof. Accepted
  for a pilot; the gold answer key keeps scoring
  reproducible.

## Constitution Alignment

Aligned with the assessment in `proposal.md`. Decisions
most relevant to the principles: D8 and D11 honor
Principle VI and the gatekeeping rule (no new gates; output
shapes stay with tools); D13 satisfies Observable Quality
(measurable, reproducible evidence with provenance in the
change record); D11 and D13 keep validation executable in
isolation (Testability). The standard itself is an
artifact-based collaboration medium (Principle I) and adds
no dependencies (Principle II).
