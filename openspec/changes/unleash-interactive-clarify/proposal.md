# Proposal: unleash-interactive-clarify

## Why

`/uf.unleash` Step 1 (Clarify, Speckit tier) exits the whole
pipeline whenever a spec.md clarification question cannot be
answered from the Dewey knowledge base. The rendered exit tells
the developer to answer the questions in the spec and re-run —
a manual spec edit plus a full pipeline restart for a decision
the human could have made in one answer. The initiating user
reported exactly this surprise: "I was expecting to be asked
questions and not have to execute /specify.clarify myself.
/uf.unleash should handle this for me."

The exit is also inconsistent inside the same pipeline: the
OpenSpec tier delegates to `/opsx-propose`, which uses the
question tool to clarify unclear artifacts, and
`/speckit.clarify` mandates one-question-at-a-time question
tool calls as a MANDATORY GATE. Only the Speckit tier of
`/uf.unleash` ejects the human into manual spec editing. Each
clarify exit additionally costs a full pipeline re-run (branch
gate, resumability detection, and scan repeat before the plan
step is reached).

## What Changes

- Step 1 (Speckit tier) gains an interactive clarify ask gate:
  after Dewey fails to answer a question — or Dewey is
  unavailable — the command asks the human that question
  through a single question tool call, one question at a time,
  carrying the question text and its surrounding spec context.
- Each ask formulates 2-5 mutually exclusive options from the
  question's own enumerated alternatives when the marker text
  enumerates them, lists the spec's stated working default
  (when present) first labeled "(Recommended)", and enables a
  custom free-form answer.
- A defer option leaves the question on the unanswerable list;
  deferred questions flow into the existing clarify exit
  unchanged — the fallback for unattended runs. When the
  question tool itself is unavailable, all questions flow to
  the exit exactly as today.
- A human answer resolves through the existing
  `resolve_clarification` tool, producing identical artifacts
  (marker removed, answer inline, `## Clarifications` log
  entry), so resumability detection and the clarify exit are
  unaffected.
- `resolve_clarification` gains an optional `resolved_by` enum
  input (`"dewey"` | `"human"`, default `"dewey"`): Dewey
  auto-resolutions render `(Dewey-resolved from X)` as today;
  ask-gate answers render `(human-answered during /uf.unleash
  clarify)`. `source` becomes conditionally required —
  required for `"dewey"`, omitted for `"human"` — enforced at
  the schema level.
- After processing, Step 1 announces the counts of
  auto-resolved, human-answered, and deferred questions.
- The command's Guardrails section names the Step 1 ask gate as
  a second legitimate mid-pipeline human interaction alongside
  the Step 4 per-finding spec review gate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `unleash`: ADDED requirement "Interactive clarify ask gate";
  MODIFIED requirement "Clarification mechanics tools" —
  Dewey-unanswerable questions route through the ask gate
  before the exit, Dewey-unavailable questions become
  interactive candidates instead of auto-deferred, and the
  Clarifications log entry records who resolved each question.

## Impact

**Files**:

- `.opencode/commands/uf.unleash.md` — Step 1 ask gate,
  frontmatter description, Guardrails exception
- `.opencode/plugins/uf-workflow/index.ts` —
  `resolve_clarification` `resolved_by` field, conditional
  `source`, provenance rendering, tool description
- `.opencode/test/unleash-clarify.test.ts` — `resolved_by`
  schema and rendering cases; existing Dewey-path assertions
  unchanged under the default
- `internal/scaffold/assets/opencode/commands/uf.unleash.md` —
  byte-identical mirror
- `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
  — byte-identical mirror
- `CHANGELOG.md`

**Behavior**: the speckit-tier clarify exit fires only for
deferred questions or when the question tool is unavailable;
interactive answers advance the pipeline to Step 2 in the same
run. The OpenSpec and quick tiers (which skip Step 1), the
Dewey query formulation, silent auto-resolution, and the exit
template text are unchanged.

**Out of scope**: `/speckit.clarify`'s own question taxonomy;
the OpenSpec and quick tiers; the clarify exit template itself;
Dewey query formulation and sufficiency judgment; the
historical speckit spec `specs/018-unleash-command` (the
behavioral contract lives in the openspec deltas).

**Docs**: CHANGELOG entry; documentation gate assessed before
PR merge (user-facing command behavior change — search-first
per the marker-superset precedent, referencing existing unleash
docs coverage rather than duplicating); AGENTS.md unchanged
(pipeline step structure unchanged).

**Sequencing**: the `unleash` capability has no baseline spec
in `openspec/specs/` — its requirements exist only as deltas in
unarchived changes. This change's MODIFIED requirement is
anchored to `clarification-marker-superset`'s unarchived text
(the current owner of "Clarification mechanics tools") and
carries its body forward verbatim except the designed clauses;
this change archives after that predecessor, and task 8.1
re-verifies the anchor at archive time (mirroring the
marker-superset archive-sequencing pattern).

## Constitution Alignment

- **I. Autonomous Collaboration — PASS**: the pipeline stays
  autonomous everywhere it can be — silent Dewey
  auto-resolution is preserved — and asks the human exactly the
  class of question the swarm cannot answer itself, then
  continues without further interaction; deferral preserves
  fully autonomous unattended runs.
- **II. Composability First — PASS**: the gate composes the
  existing question tool, the existing `resolve_clarification`
  mechanics, and the existing clarify exit template; no new
  plugin, tool, or registration — one optional schema field.
- **III. Observable Quality — PASS**: every resolution's
  Clarifications log entry records who answered it
  (Dewey-resolved vs human-answered), and Step 1 announces the
  auto-resolved / human-answered / deferred counts.
- **IV. Testability — PASS**: the `resolved_by` schema, the
  conditional `source` requirement, and both provenance
  renderings are pure plugin logic pinned by vitest cases; the
  default rendering keeps every existing assertion valid.
- **V. Security by Default — PASS**: the new input is a closed
  zod enum with fail-closed conditional validation; marker
  matching, path validation, and all other schemas are
  unchanged.
- **VI. Deterministic Execution — PASS**: the ask gate is a
  structural tool gate (a question tool call the command MUST
  make and await), not a prose suggestion; option formulation,
  ordering, labeling, defer, fallback, and the counts
  announcement are fixed rules, and the default `resolved_by`
  keeps prior inputs behavior-identical.
