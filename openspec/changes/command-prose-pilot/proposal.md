## Why

The 32 slash commands in `.opencode/commands/` (~10,600 lines,
~57,000 words) are the primary medium through which human
intent reaches agents. Observed agent confusion is structural,
not lexical. Line-verified examples:

- **Numbering collisions** — `uf.unleash.md` runs three
  parallel numbering schemes (markdown sections 0-10,
  pipeline Steps 1-8, TodoWrite steps 0-10) and its
  cross-references mix frames: "Step 8 (Code Review)" at line
  997 uses section numbering while "step 5" at line 367 uses
  step numbering. The same token resolves to different steps
  depending on which frame the reader assumes.
- **Propagated reference defect** — `uf.run-pipeline-plan.md`
  line 132 says "Step 8 (code review) MUST NOT be skipped",
  but code review is Step 6 in uf.unleash step numbering;
  Step 8 is Demo.
- **One word, two state machines** — STOP means "halt the
  command" in uf.unleash, but "pause and return a GATE
  value" in the Gate Relay Protocol of uf.run-pipeline-plan.
- **Control flow as prose** — branching logic written as
  100+-word paragraphs nested 3-4 levels deep.
- **Cross-file normative references** — pipeline steps cite
  "Normative protocol reference" sections of a 6,900-word
  sibling command mid-execution.

ASD-STE100 (Simplified Technical English) was evaluated and
rejected for literal adoption: it is an aerospace dictionary
built for human non-native speakers, while the observed LLM
failure modes are ambiguity, contradiction, and state
tracking. Its disciplines are adapted instead: one word one
meaning, one action per step, short sentences, no synonyms.

## What Changes

1. **House prose standard** — codified as this change's
   `design.md`: a canonical verb glossary with a ban list,
   reference-by-name instead of bare numbers, one numbering
   scheme per document, sentence and step-size limits,
   decision tables for branching logic, a fixed step
   template, and boilerplate-defined-once. Conformance is
   validated with `rg` checks during this change only; no
   CI gate is added (gatekeeping rule).
2. **Pilot rewrite of `/uf.run-pipeline-plan`** — both
   copies (`.opencode/commands/` and
   `internal/scaffold/assets/opencode/commands/`) rewritten
   atomically, byte-identical. The behavioral contract is
   preserved: three-subagent orchestration, gate relay,
   disk handoff verification, tracking and guardrail rules.
   The three known semantic defects are corrected to the
   behavior the rest of the corpus evidences as intended:
   the "Step 8 (code review)" reference, the Gate Relay
   STOP collision, and the session-resume guard halt.
3. **Validation** — `make check`; static metrics
   before/after (satisfies DE-004 measurable-deltas);
   comprehension A/B testing in fresh sessions against a
   gold answer key; `/uf.unleash` dogfooded on this change.

Non-goals: rewriting any other command; promoting the
standard to a permanent skill/pack home (phase 2, the
determinism skill+pack precedent); extracting mechanical
procedures into tools (Principle VI workstream); any plugin
or runtime changes.

## Capabilities

### New Capabilities
- `command-prose-standard`: rules governing prose form in
  agent instruction files — verb semantics, reference style,
  numbering, sentence structure, decision tables, step
  template — piloted against one command with before/after
  evidence.
- `run-pipeline-plan`: prose-conformance requirements for
  the rewritten `/uf.run-pipeline-plan` command file. The
  behavioral contract is preserved unchanged (it is owned by
  the `run-plan-command` change, which has no baseline
  capability yet); this capability adds conformance,
  preservation, defect-correction, byte-identity, and
  measured-delta requirements for the rewrite.

### Modified Capabilities
None.

### Removed Capabilities
None.

## Impact

- **Files**: `.opencode/commands/uf.run-pipeline-plan.md`,
  `internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md`
  (byte-identical pair), `openspec/changes/command-prose-pilot/`
  (this change), `CHANGELOG.md` (entry).
- **Tests**: no test-content changes required. Go tests
  reference the command only by path (the
  `expectedAssetPaths` drift check); `make check` verifies
  the pair stays in sync and no plugin tests regress.
- **Hero repositories**: the assets copy is canonical;
  `uf init` propagates the rewrite on each hero's next
  scaffold sync. No hero action is required in this change.
- **Docs gate**: CHANGELOG entry; documentation issue per
  the AGENTS.md gate (command instruction text changes,
  though the behavioral contract is preserved).
- **Follow-ons (out of scope)**: phase 2 promotes the
  validated standard to a repo-local skill + convention
  pack pair (the determinism precedent; it carries the
  website-documentation and blog/tutorial obligations —
  disposition dated 2026-10-17 in this change's
  metrics.md); phase 3 rolls the standard out to
  `uf.unleash.md`, `uf.review-council.md`, then the
  remaining corpus, one OpenSpec change each.

## Constitution Alignment

Assessed against the Unbound Force org constitution (six
active principles).

### I. Autonomous Collaboration

**Assessment**: PASS

Commands are the artifact medium through which intent
reaches agents. The standard makes them unambiguous and
self-describing. No runtime coupling is introduced or
removed.

### II. Composability First

**Assessment**: PASS

No new dependencies. The standard governs prose form only;
the command remains standalone and independently usable.

### III. Observable Quality

**Assessment**: PASS

Validation is measurable and reproducible: static metrics
(lines, words, sentence length, verb token frequencies)
captured before and after; comprehension A/B scored against
a gold answer key. This satisfies DE-004 (measurable
deltas in change records).

### IV. Testability

**Assessment**: PASS

All validation is executable without external services:
`make check`, `rg` conformance checks, a metrics diff, and
fresh-session comprehension runs with fixed scenarios.

### V. Security by Default

**Assessment**: PASS

No dependencies, permissions, CI surfaces, or gates change.
The rewrite removes no guardrails; PR-targeting, staging,
and merge rules are preserved verbatim in intent.

### VI. Deterministic Execution

**Assessment**: PASS

Complementary, not conflicting: Principle VI decides where
logic lives (tools versus prose); this standard governs how
the remaining judgment prose reads. The rewrite adds no
mechanical prose, preserves DE-002 decision-point examples
where tools own output formats, and adds no rendered-shape
previews (DE-003).
