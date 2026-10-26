# Design: unleash-interactive-clarify

## Context

`/uf.unleash` Step 1 (Speckit tier) scans spec.md for
clarification markers, silently auto-resolves what Dewey can
answer, and collects every other question on an unanswerable
list that exits the pipeline through `format_unleash_exit`
variant "clarify". The rendered exit tells the developer to
answer the questions in the spec and re-run — a manual spec
edit plus a full pipeline restart for a decision the human
could have made in one answer. The initiating user reported
exactly this surprise: "I was expecting to be asked questions
and not have to execute /specify.clarify myself."

The inconsistency is internal to the command: the OpenSpec tier
delegates to `/opsx-propose`, which uses the question tool to
clarify unclear artifacts, and `/speckit.clarify` mandates
one-question-at-a-time question tool calls as a MANDATORY GATE.
Only the Speckit tier's Step 1 ejects the human into manual
editing.

The mechanics already exist. `scan_clarifications` returns each
question with context and line number; `resolve_clarification`
removes the marker, splices the answer inline, and appends the
`## Clarifications` entry; resumability detection derives
clarify completion from the artifacts those tools produce. The
missing piece is only the interaction.

## Goals / Non-Goals

### Goals

- Ask each Dewey-unanswerable question interactively — one
  question tool call per question, carrying the question and
  its spec context — before any clarify exit.
- Route human answers through `resolve_clarification` so the
  spec artifacts and resumability are identical to silent
  auto-resolution.
- Preserve the clarify exit unchanged as the defer fallback and
  the question-tool-unavailable fallback.
- Record who resolved each question in the Clarifications log.
- Mirror all changed `.opencode/` assets byte-identically under
  `internal/scaffold/assets/opencode/`.

### Non-Goals

- The OpenSpec and quick tiers (they skip Step 1 entirely).
- Dewey query formulation, result evaluation, sufficiency
  judgment, or silent auto-resolution.
- The clarify exit template text, `scan_clarifications`, or
  resume detection.
- `/speckit.clarify`'s taxonomy questions and its five-question
  cap (this gate has none — every marker must resolve or
  defer).
- The historical speckit spec `specs/018-unleash-command` (the
  behavioral contract lives in the openspec deltas).

## Decisions

### D1. Ask gate placement and trigger set

The gate sits between per-question Dewey processing and the
exit decision in Step 1. Two populations feed it: questions
whose Dewey results were insufficient, and — a deliberate
behavior change — questions from a Dewey-unavailable session,
which today dump straight to the unanswerable list. Both are
questions only the human can answer; withholding them from the
gate would preserve the exact surprise this change fixes. The
Dewey-satisfied population never reaches the gate (silent
auto-resolution is preserved).

### D2. Question delivery contract

One question tool call per question, never batched; the next
question is presented only after the previous response is
received (the `/speckit.clarify` MANDATORY GATE precedent,
adapted to the question tool). The ask carries the question
text and the scan's surrounding context lines, so the human
sees the spec's own framing. Options are formulated from the
question's own enumerated alternatives when it enumerates them
(two to five, mutually exclusive — the framework-null question
that triggered this change enumerates exactly three: JSON null,
empty string, key omitted); the spec's stated working default,
when present, is listed first and labeled "(Recommended)"; the
custom free-form option stays enabled for answers outside the
enumerated space. There is no question cap: unlike
`/speckit.clarify`'s optional taxonomy questions, every
scanned marker must resolve or defer before Step 1 completes.

### D3. Defer and fallback

Every ask includes a defer option. Deferral leaves the question
on the unanswerable list, and the existing exit path —
`format_unleash_exit` variant "clarify" with the {question,
context} pairs — fires unchanged when any deferred questions
remain. This preserves three properties: unattended runs (the
human can defer everything and let the exit render), the exit
template's role as the durable pause artifact, and a fallback
when the question tool is unavailable in the host — in that
case no ask is attempted and all questions flow to the exit
exactly as today. After processing, the command announces the
auto-resolved, human-answered, and deferred counts so the
session transcript records the mix.

### D4. Resolution path and provenance

A human answer is applied by calling `resolve_clarification`
with `resolved_by: "human"` — the same tool, the same marker
matching, the same artifacts. The tool gains one optional enum
input, `resolved_by` (`"dewey" | "human"`), defaulting to
`"dewey"`:

- `resolved_by` "dewey" (or omitted): `source` is required, and
  the Clarifications entry renders
  `- Q: ... -> A: ... (Dewey-resolved from ${source})` — the
  current format, byte-identical, so every existing caller and
  test assertion is unaffected.
- `resolved_by` "human": `source` MUST be omitted (the answer's
  origin is the ask gate itself; accepting a source would
  silently drop it, since the human suffix does not interpolate
  it), and the entry renders
  `- Q: ... -> A: ... (human-answered during /uf.unleash
  clarify)`.

The conditional requirement is enforced at the schema level
(fail-closed), not left to caller discipline. The tool
description strings are updated to describe both modes.

### D5. Autonomy guardrail compatibility

The inter-step autonomy guardrail prohibits pausing between
pipeline steps for human confirmation. The ask gate is not
that: it is required human input within Step 1 — the same class
as the Step 4 per-finding spec review decision gate, which the
shipped Guardrails section already names as its "single
exception" mid-pipeline interaction. A clarification question
is a decision the swarm cannot make (that is why Dewey failed);
asking it is the collaborative act, not a confirmation pause.
The clarify exit remains a valid halt via defer, so unattended
behavior is unchanged. The command's Guardrails first bullet is
extended to name the Step 1 ask gate as a second exception
alongside Step 4's, and the new ADDED requirement states the
distinction explicitly rather than modifying the legacy
`unleash-autonomy` capability text.

### D6. Command prose delta

`uf.unleash.md` changes: (a) Step 1's unanswerable branch gains
the ask gate (single question tool call per question, context,
options, recommended-first, custom, defer; resolve via
`resolve_clarification` with `resolved_by` "human"; counts
announcement; exit only on deferred questions;
question-tool-unavailable fallback to today's behavior); (b)
the Dewey-unavailable note routes its questions into the gate
too; (c) the frontmatter description mentions interactive
clarify; (d) the Guardrails bullet names the second exception.
The exit template, step numbering, and all other steps are
untouched.

### D7. Mirrors and verification

Changed `.opencode/` paths are mirrored byte-identically under
`internal/scaffold/assets/opencode/`:
`commands/uf.unleash.md` and `plugins/uf-workflow/index.ts`.
Test files under `.opencode/test/` are not scaffold assets.
Verification: `make plugin-test`, `make test` (drift tests
enforce the mirrors), `make lint`, and
`openspec validate unleash-interactive-clarify --type change
--strict`.

Constitution alignment (all six PASS, per proposal): I — the
gate asks exactly the questions the swarm cannot answer and
nothing else; II — composes the question tool, the existing
resolve mechanics, and the existing exit; III — provenance and
counts make every resolution observable; IV — schema and
rendering pinned by vitest cases; V — closed enum with
fail-closed conditional validation, everything else unchanged;
VI — a structural tool gate with fixed rules, and the default
path byte-identical.

## Risks / Trade-offs

- The gate could read as an autonomy-guardrail violation.
  Mitigation: D5's within-step distinction, the defer option,
  and the unchanged exit fallback; the guardrail's enumerated
  valid exits still include the clarify exit.
- Option formulation quality varies with the question. The
  question's own enumerated alternatives are the source of
  truth when present; the custom free-form option guarantees
  the human is never boxed into a wrong choice.
- No cap means a marker-heavy spec produces a long interactive
  session. Accepted: every marker must resolve or defer for
  clarify to complete, deferring everything preserves the old
  exit behavior, and `/speckit.specify`'s autonomy instruction
  already minimizes marker count.
- Schema strictness on `source` (required for dewey,
  forbidden for human) rejects sloppy callers. That is the
  point: provenance honesty, fail-closed.
- The clarify exit's rendered text still says to answer in the
  spec and re-run — now accurate for deferred questions only.
  Rewriting it is out of scope; the guidance remains correct
  for the questions that reach the exit.
