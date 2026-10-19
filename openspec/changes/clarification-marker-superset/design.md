# Design: clarification-marker-superset

## Context

The uf-workflow plugin currently defines the clarification
marker grammar twice:

- `CLARIFICATION_MARKER_PREFIX` (`"[NEEDS CLARIFICATION"`) is a
  bare substring probed by `uf_unleash_detect_resume` to decide
  whether the clarify step is complete.
- `CLARIFICATION_MARKER_PATTERN`
  (`/\[NEEDS CLARIFICATION:\s*([^\]]*?)\s*\]/g`) is the
  colon-only extractor used by `scan_clarifications`,
  `resolve_clarification`, and `countClarificationMarkers`.

The divergence wedges the pipeline: a hand-written bare
`[NEEDS CLARIFICATION]` marker holds clarify open forever
(detect_resume sees the prefix) while scan_clarifications
returns zero questions (no colon form), leaving no resolution
path. The prefix probe also false-positives on pluralized
(`[NEEDS CLARIFICATIONS]`) or unterminated
(`[NEEDS CLARIFICATION` prose) text.

Issue #743 (finding 5) prescribes the fix: make the extractor
handle the superset, treating bare forms as unscoped questions.
The divergence originated in the unleash-deterministic-tools
spec delta, which referenced the marker at two precisions; this
change unifies the grammar across both requirements (see
proposal Constitution Alignment, all six principles PASS).

## Goals / Non-Goals

### Goals

- Define the marker grammar exactly once, consumed by
  scan_clarifications, resolve_clarification, and the
  detect_resume clarify probe.
- Extract all closed-bracket forms as questions: colon form
  (scoped), bare-with-text (unscoped), and completely bare
  (unscoped, raw marker text).
- Guarantee non-empty question text so resolve round-trips
  (schema `question` min(1)) and the Clarifications log and
  clarify exit stay self-describing.
- Replace the substring probe with grammar-derived marker
  presence (per-line, complete-marker matching).
- Keep tool envelope shapes and schemas unchanged.
- Mirror all changed `.opencode/` assets byte-identically under
  `internal/scaffold/assets/opencode/`.

### Non-Goals

- Multi-line questions (per-line matching and the no-`]`
  constraint are inherited unchanged).
- Schema changes (question min(1) stays; the fallback makes it
  satisfiable rather than relaxing it).
- The other findings in #743, or #741 / #742 follow-ups.
- Changing the Dewey judgment flow (query formulation,
  sufficiency evaluation, silent auto-resolution, exit
  template).

## Decisions

### D1. One shared grammar constant

Delete `CLARIFICATION_MARKER_PREFIX`. Keep a single
`CLARIFICATION_MARKER_PATTERN` built from the source:

    \[NEEDS CLARIFICATION(?::\s*([^\]]*?)\s*|\s+([^\]]*?)\s*|\s*)\]

Alternation order encodes the three forms:

1. `:\s*([^\]]*?)\s*` — colon form; question captured in
   group 1 (existing behavior).
2. `\s+([^\]]*?)\s*` — bare-with-text; the leading `\s+`
   requires whitespace so suffix-glued text (the plural `S`)
   cannot be swallowed; unscoped text captured in group 2.
3. `\s*` — completely bare; no capture group.

Consequences of the ordering: `[NEEDS CLARIFICATIONS]` does
not match (the trailing `S` defeats branches 1 and 3, and
branch 2 requires whitespace); unterminated text does not
match (no closing `]`); a malformed spaced colon
(`[NEEDS CLARIFICATION : q]`) degrades to the unscoped branch
and extracts `: q` (colon retained) rather than failing. Flanking
whitespace is trimmed; internal whitespace is preserved
(existing padded-marker behavior).

The pattern keeps the `g` flag and is used only via per-line
`String.matchAll`, which does not leak `lastIndex` state.

### D2. Question-extraction helper

Add one helper consumed by every extractor path: trimmed
group 1, else trimmed group 2, else empty; if the result is
empty, fall back to the raw marker text (match[0], trimmed).

The fallback keeps questions non-empty: a bare marker scans
as its own raw text (self-describing in the Clarifications
log and the clarify exit), and the pre-existing empty colon
form (`[NEEDS CLARIFICATION: ]`) becomes resolvable instead
of reporting an unresolvable empty question.

### D3. Consumers rewired to the shared grammar

- `scan_clarifications`: per-line matchAll; question =
  helper(match); context and line number unchanged.
- `replaceClarificationMarker`: locates the first marker whose
  helper(match) equals the `question` argument exactly as
  scanned; answer splicing and MARKER_NOT_FOUND unchanged.
- `countClarificationMarkers`: unchanged logic; now counts the
  superset.
- `uf_unleash_detect_resume`: `hasMarkers` derives from
  `countClarificationMarkers(specText) > 0`; the substring
  `includes(CLARIFICATION_MARKER_PREFIX)` probe is deleted.

Because scan and resolve extract through the same helper, the
resolve round-trip (question passed back exactly as scanned)
remains exact for all three forms.

### D4. Probe precision trade-off

Marker-like text outside the grammar (pluralized,
unterminated) no longer holds clarify open. This trades an
unsatisfiable wedge — blocked with no resolution path — for
precision. The fail-safe property that matters is preserved:
any grammar-matched marker, however written, holds clarify
open until resolved, and every blocked question now surfaces
in scan output (visible resolution path). The trade-off is
pinned by spec scenarios and tests.

The superset also changes how mention occurrences behave:
well-formed marker text appearing as documentation — quoted
syntax, fenced examples, or scenario prose inside spec.md —
extracts as a question, and resolving it splices the answer
into that prose (matching is per-line over all lines; the
grammar has no code-fence or backtick exclusion). The old
probe already held clarify open on such mentions (substring
match); the new behavior adds a resolution path that mutates
the mentioned prose. This change's own spec delta embeds
literal marker forms in scenario text, so grammar-documenting
specs self-trigger. Accepted trade-off: mention-only
occurrences surface as questions and are resolved or manually
removed like any other marker — except that for the
completely-bare and empty-colon fallback forms, the
Clarifications log entry written by resolution quotes the
raw marker text and itself grammar-matches: tool-mediated
resolution of that self-generated mention appends a fresh
mention each cycle and does not terminate, so the
terminating path is manual removal of the literal marker
syntax from the log entry; prose that must not extract
avoids literal marker syntax.

### D5. Command prose (measurable delta)

uf.unleash.md Step 1 gains one sentence: for bare-marker
questions (whose question text is the raw marker), formulate
the Dewey query from the surrounding context rather than the
marker text, extending the existing "do not use the raw
marker text verbatim" note. Instruction-text change with a
measurable line/token delta (Constitution VI).

### D6. Mirrors and verification

Changed `.opencode/` paths are mirrored byte-identically under
`internal/scaffold/assets/opencode/`:
`plugins/uf-workflow/index.ts`, `commands/uf.unleash.md`, and
`lib/unleash-templates.ts` (matching the proposal Impact list
and task 2.1). Test files under `.opencode/test/` are not
scaffold assets. Verification: `make plugin-test`, `make test`
(drift tests enforce the mirrors), `make lint`.

### D7. Declared dependency update (maintainer-directed)

The working tree carries `@opencode-ai/plugin` 1.4.10 → 1.19.0
in `.opencode/package.json` plus the lock refresh. The
maintainer elected to keep and declare it rather than revert.
The AGENTS.md gatekeeping exception permits a pin update only
for a documented security or CI reliability fix; no such
justification is recorded, so the update is declared
maintainer-directed and the review council and PR review must
judge it explicitly.

Scope of the update, derived from the lock diff rather than
recall: direct dependency `@opencode-ai/plugin` 1.4.10 →
1.19.0 (`zod` 4.1.8 unchanged). Transitive refresh:
`@opencode-ai/sdk` 1.4.10 → 1.19.0, `effect` 4.0.0-beta.48
→ 4.0.0-beta.83, `fast-check` 4.7.0 → 4.10.2, `ini` 6.0.0
→ 7.0.0, `msgpackr` 1.11.10 → 2.1.1, `msgpackr-extract`
3.0.3 → 3.0.4 (all six platform binaries), `multipasta`
0.2.7 → 0.2.8, `pure-rand` 8.4.0 → 8.4.2, `yaml` 2.8.3 →
2.9.1. New packages: `@ai-sdk/provider` 3.0.8 (a new direct
dependency of `@opencode-ai/plugin` 1.19.0) and its
dependency `json-schema` 0.4.0. No packages removed. The
`toml` 4.2.0 and `uuid` 13.0.1 security overrides hold
(verified in the lock).

Engine floor (task-owned, not a bare watch-item):
`ini@7.0.0` requires Node ^22.22.2 || ^24.15.0 || >=26.0.0
while CI pins `node-version: 22` (latest 22.x). Task 4.6
verifies the CI-resolved Node 22.x version satisfies the
range and records the result; task 5.4 records the implied
runtime floor in AGENTS.md Technology Stack. npm treats
engines as warnings by default, so contributors below the
floor see EBADENGINE degradation rather than a hard failure
— recording the floor makes that failure mode visible.

Gates remain enforced at the new pin (in-change updates):

- both manifests mirror byte-identically under
  `internal/scaffold/assets/opencode/` (drift tests);
- `TestPluginPackageInputs_ExactVersionsAndLockIntegrity`
  expectedRuntime moves to 1.19.0 (zod, the dev dependencies,
  and the toml/uuid override assertions are unchanged — the
  lock holds them);
- `TestPluginPackageInputs_RollbackPrerequisites` and
  `internal/scaffold/testdata/plugin-package-rollback.json`
  record the new baseline lock SHA256
  `5ebee4af68d7a6125f5d0f52ecca7c419bbfbd9beff13503f3d5d6f36a09f965`;
- the pin is a five-place record: the unarchived
  `review-council-multi-model-fanout` change's SC-FR-003
  "Reproducible Plugin Dependencies" requirement pins the
  plugin version and baseline lock SHA by MUST text, so this
  change carries a `specs/scaffold/spec.md` delta with a
  MODIFIED requirement (plugin 1.19.0, Zod 4.1.8, baseline
  `5ebee4af…`) anchored to that predecessor's unarchived
  text — the spec record moves with the pin instead of
  planting a MUST the shipped manifests contradict;
- AGENTS.md Technology Stack records 1.19.0.

Rollback: revert `.opencode/package.json`,
`.opencode/package-lock.json`, both scaffold mirror copies,
the two test constants, the testdata baseline SHA, the
`specs/scaffold/spec.md` delta, and the AGENTS.md version
line and engine-floor sentence — restoring the 1.4.10 pin
and the `b628c764…` baseline. Validation: `make plugin-test` and `make test`
(the pin-enforcement and drift tests are the evidence the
gates still hold at the new pin), plus the Phase 4
engine-floor verification and local vulnerability scan
(tasks 4.6 and 4.7) over the refreshed lock.

Constitution alignment (all six PASS, per proposal, with the
D7 declaration): Autonomous Collaboration — the raw-text
fallback keeps every blocked question self-describing;
Composability First — internal to uf-workflow (D7 bumps an
existing pinned dependency, declared); Observable
Quality — envelope shapes and provenance unchanged;
Testability — pure-function grammar pinned by vitest cases;
Security by Default — schemas and validation unchanged (D7
enumerates the lock-derived transitive surface, holds the
override pins, moves the SC-FR-003 spec record with the
pin, and adds the Phase 4 vulnerability scan); Deterministic
Execution — the divergence was a determinism defect;
single-sourcing removes it.

## Risks / Trade-offs

- Malformed markers (unterminated, pluralized) no longer
  block clarify. A genuinely intended but malformed question
  could be missed. Mitigation: every closed-bracket form of
  the exact marker phrase is covered; unterminated text is
  indistinguishable from prose;
  behavior pinned by tests.
- MARKER_NOT_FOUND interpolates the question, which for bare
  markers is the raw marker text. Cosmetic; the message
  remains actionable.
- Empty-question extraction changes behavior for the
  colon-empty form (fallback text instead of empty string).
  Strict improvement (previously unresolvable); the
  bare-marker tests pinned the old behavior and must be
  inverted, while the colon-empty fallback is newly covered.
- The `question` schema bound (`min(1)`, `max(4096)`) is
  inherited unchanged while extraction is length-unbounded:
  a grammar-matched marker whose extracted question exceeds
  4096 characters surfaces in scan output but
  `resolve_clarification`'s input validation rejects it
  before MARKER_NOT_FOUND is reached — a residual wedge at
  the schema's upper bound, inherited from the colon form.
  Mitigation: manual removal of the over-long marker from
  spec.md (documented known failure mode; the superset does
  not introduce the bound).
- One alternation regex is harder to read than two simple
  constants. Mitigation: doc comment enumerating the three
  branches, the helper, and per-branch test fixtures.
