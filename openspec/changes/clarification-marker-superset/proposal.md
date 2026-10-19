# Proposal: clarification-marker-superset

## Why

Issue #743 tracks the round-2 review council's deferred LOW findings
from `unleash-deterministic-tools` (merged as PR #745). Maintainer
triage (2026-10-17) resolved or staled five of the six; finding 5 is
the only remaining actionable item: the clarification-marker grammar
diverges between the two tools that consume it.

- `uf_unleash_detect_resume` probes spec.md with
  `CLARIFICATION_MARKER_PREFIX` (`"[NEEDS CLARIFICATION"`), a bare
  substring match: any text containing the prefix marks clarify
  incomplete.
- `scan_clarifications` extracts with
  `CLARIFICATION_MARKER_PATTERN`, which requires the colon form
  (`[NEEDS CLARIFICATION: question]`).

A hand-written bare marker (`[NEEDS CLARIFICATION]`) therefore wedges
the pipeline permanently: detect_resume reports clarify incomplete on
every resume while scan_clarifications returns zero questions — a
fail-safe detector with no paired resolution path. The probe also
trips on plural `[NEEDS CLARIFICATIONS]` text and unterminated
`[NEEDS CLARIFICATION` strings, neither of which the extractor can
ever remove. The issue prescribes the fix: "make the extractor handle
the superset (bare forms as unscoped questions)."

## What Changes

- **Single-sourced grammar**: one shared marker grammar replaces both
  `CLARIFICATION_MARKER_PREFIX` and
  `CLARIFICATION_MARKER_PATTERN`; scan, resolve, count, and the
  detect_resume probe all derive from it (learning
  determinism-20261016T152653: derive both grammars from a single
  shared constant).
- **Superset extraction**: the grammar accepts three forms —
  colon (`[NEEDS CLARIFICATION: q]`, question captured), bare with
  text (`[NEEDS CLARIFICATION text]`, unscoped), and completely bare
  (`[NEEDS CLARIFICATION]`). Bare and empty-question forms extract as
  unscoped questions whose question text falls back to the raw marker
  text, so questions are never empty and `resolve_clarification`
  round-trips (its `question` schema requires min(1) characters).
- **Probe precision**: detect_resume's marker check derives from the
  same grammar per-line. Plural and unterminated false positives no
  longer block clarify — they previously formed an unsatisfiable
  wedge (blocked with no resolution path), not fail-safety.
- **Command prose**: `/uf.unleash` Step 1 extends the existing "do
  not use the raw marker text verbatim" guidance — for bare-marker
  questions, formulate the Dewey query from the surrounding context.
- **Tests**: the pinned bare-marker non-extraction behavior in
  `unleash-clarify.test.ts` is inverted; new cases cover all three
  forms, empty and whitespace-padded questions, and the resume probe.
- **Mirrors**: every changed `.opencode/` asset is updated
  byte-identically under `internal/scaffold/assets/opencode/`,
  enforced by drift tests.
- **Declared dependency update** (design D7): maintainer-directed
  `@opencode-ai/plugin` 1.4.10 → 1.19.0 in `.opencode/package.json`
  and `.opencode/package-lock.json`. Complete lock-derived scope
  in D7: nine transitive packages refreshed (`@opencode-ai/sdk`,
  `effect`, `fast-check`, `ini`, `msgpackr`, `msgpackr-extract`,
  `multipasta`, `pure-rand`, `yaml`), two new transitive packages
  (`@ai-sdk/provider` 3.0.8, `json-schema` 0.4.0), none removed;
  the `toml` 4.2.0 and `uuid` 13.0.1 security overrides hold.
  Kept and declared per maintainer decision; the AGENTS.md
  gatekeeping exception's security/CI-reliability justification
  condition is not satisfied — recorded as maintainer-directed
  for the review council to judge. Pin-enforcement gates stay
  enforced at the new pin (scaffold manifest mirrors,
  exact-version test constants, rollback baseline lock SHA256,
  the SC-FR-003 "Reproducible Plugin Dependencies" spec record
  moved via a `specs/scaffold/spec.md` delta, AGENTS.md
  Technology Stack); rollback documented in D7.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `unleash`: clarify-step marker handling uses one single-sourced
  superset grammar across `scan_clarifications`,
  `resolve_clarification`, and `uf_unleash_detect_resume`; bare
  markers surface as unscoped questions instead of wedging resume
  detection.
- `scaffold`: the SC-FR-003 "Reproducible Plugin Dependencies"
  requirement is modified to move the plugin pin (1.19.0) and the
  rollback baseline lock SHA256 with the declared dependency
  update, anchored to `review-council-multi-model-fanout`'s
  unarchived text (design D7).

### Removed Capabilities

- None.

## Impact

- **Files**: `.opencode/plugins/uf-workflow/index.ts` + mirror;
  `.opencode/commands/uf.unleash.md` + mirror;
  `.opencode/lib/unleash-templates.ts` + mirror (the
  `ClarifyQuestion.question` doc comment updated for the
  superset forms); `.opencode/test/unleash-clarify.test.ts`;
  `.opencode/test/unleash-resume.test.ts`; `CHANGELOG.md`;
  `.opencode/package.json` + `.opencode/package-lock.json` +
  their scaffold mirrors, `internal/scaffold/scaffold_test.go`,
  and `internal/scaffold/testdata/plugin-package-rollback.json`
  (declared dependency update, design D7); this change's
  `specs/scaffold/spec.md` delta (MODIFIED SC-FR-003 pin record,
  design D7); `.opencode/commands/speckit.specify.md` (superset
  grammar teaching bullets, task 5.2) and
  `.specify/templates/spec-template.md` (non-literal grammar
  note, task 5.2); `AGENTS.md` (Technology Stack version sync
  plus Node engine floor, design D7; Coding Conventions
  clarification-marker bullet, task 5.2).
  `opencode.json` unchanged — no new tools or registrations.
- **Behavior**: colon-form extraction, resolution, and resume
  semantics are unchanged. Bare closed-bracket markers now extract
  and resolve instead of wedging. Plural and unterminated markers no
  longer hold clarify open (trade-off documented in design: these
  forms previously had no resolution path, so blocking on them was a
  defect, not fail-safety).
- **Out of scope**: #741 (uf-workflow index decomposition), #742
  (epic blog post), and the five #743 findings already addressed or
  staled by maintainer triage.
- **Docs**: CHANGELOG entry. The documentation-issue gate is assessed
  in the tasks artifact — bare-marker behavior is a user-visible
  workflow delta (a hand-written marker that previously wedged
  `/uf.unleash` now resolves), so the gate is not presumed exempt.
- **Sequencing**: the `unleash` capability exists only in the
  unarchived `unleash-deterministic-tools` change (baseline
  `openspec/specs/` has no `unleash` capability), so this
  change's spec delta uses one ADDED requirement plus two
  MODIFIED requirements anchored to `unleash-deterministic-tools`'
  unarchived text — the same chained-change pattern
  `unleash-deterministic-tools` used against
  `unleash-direct-review-dispatch` (which is ADDED-only because
  it created the capability). The `scaffold` capability delta
  follows the same pattern: SC-FR-003 exists only in the
  unarchived `review-council-multi-model-fanout` change, so the
  MODIFIED requirement anchors to that predecessor's unarchived
  text. Archive order: this change archives after both
  predecessors; task 7.1 re-verifies all three MODIFIED anchors
  at archive time.

## Constitution Alignment

- **I. Autonomous Collaboration — PASS**: markers remain a text
  artifact interface in spec.md with self-describing tool envelopes.
  The change pairs the fail-safe detector with a visible resolution
  surface: every blocked marker form now appears in scan output or
  the clarify exit (learning determinism-20261017T181139). No new
  runtime coupling.

- **II. Composability First — PASS**: the change is internal to the
  uf-workflow plugin `/uf.unleash` already requires; no new plugin
  or mandatory peer. `scan_clarifications` and
  `resolve_clarification` remain independently usable tools.
  Single-sourcing removes an internal inconsistency rather than
  adding coupling. The declared `@opencode-ai/plugin`
  1.4.10 → 1.19.0 update (design D7) is a version bump of an
  existing pinned direct dependency — the two new transitive
  packages (`@ai-sdk/provider`, `json-schema`) are enumerated in
  D7 and add no mandatory peer of this repository's code —
  declared in Impact, maintainer-directed, with the
  pin-enforcement gates held at the new pin; the gatekeeping
  exception's justification condition is unsatisfied and the
  review council must judge it.

- **III. Observable Quality — PASS**: scan output remains
  machine-parseable (`{questions, count}` with per-question context
  and line provenance); bare markers now surface as observable
  questions instead of invisible wedges. Envelope shapes and error
  codes are unchanged, so existing consumers do not break.

- **IV. Testability — PASS**: the grammar is a pure function over
  text; tools keep injected filesystem dependencies. Vitest cases
  pin all three marker forms, empty/padded questions, exact-match
  resolution round-trips, and the resume probe; drift tests enforce
  the byte-identical mirrors. No external services required.

- **V. Security by Default — PASS**: existing schema validation
  (bounded strings, `.strict()`, pathspec-magic rejection on
  `feature_dir`) is unchanged; the fallback question text derives
  from the matched marker itself, not from unvalidated input. The
  declared dependency update (design D7) refreshes the dependency
  surface — nine transitive packages updated and two new
  transitive packages (`@ai-sdk/provider` 3.0.8,
  `json-schema` 0.4.0; complete lock-derived list in D7) — with
  the `toml`/`uuid` security overrides held, the exact-version
  gate tests and the SC-FR-003 spec record moved with the
  declared pin, and a Phase 4 local vulnerability scan (task
  4.7) covering the refreshed lock.

- **VI. Deterministic Execution — PASS**: the divergence was itself
  a deterministic-execution defect — two tools re-deriving the same
  textual grammar differently, with prose tests pinning the
  inconsistency. This change extracts the superset grammar to code
  with a single shared constant and unifies grammar precision across
  the spec delta's requirements (learning determinism-20261017T145239).
