## Why

The review council validates code quality across correctness,
architecture, security, testing, and conventions — but it does
not validate that a change addresses the GitHub issue that
initiated the pipeline. The council answers "is this code
good?" but not "is this the right code?" (issue #563).

Three gaps produce this blindness:

1. **The issue number never reaches review time.** Tier
   routing resolves the originating issue and records it in
   branch-scoped checkpoint state and `.openspec.yaml`
   (`originating_issue`), but only `/uf.finale` consumes it,
   to emit `Closes #N` in the PR body.
2. **Issue linking is conditional and advisory.** The
   review-context skill's Protocol 2 runs only when an
   explicit PR number is provided. The local pre-PR path —
   `/uf.unleash` Step 6, which dispatches the council
   directly through the review-dispatch plugin with no PR —
   skips it entirely, and its fetch errors never gate a
   verdict.
3. **No persona owns issue-intent evaluation.** divisor-guard
   checks the implementation against spec artifacts, but the
   originating issue's acceptance criteria — the requirement
   of record when spec and issue diverge, or when no spec
   exists — never reach its prompt.

A PR can therefore pass every quality check while silently
drifting from the originating requirement. This is the
review-council instance of the general eval-harness gap
("does agent output satisfy success criteria?"), and
building it first may inform the general design.

## What Changes

Add a first-class intent-satisfaction check to the Divisor
review council in CODE review mode, validating the reviewed
changes against the originating issue's acceptance criteria:

1. **Issue-ID threading (required state).** The code review
   dispatch MUST carry the originating issue reference,
   resolved from branch-scoped pipeline state (tier-routing
   checkpoint) or `.openspec.yaml` `originating_issue` when
   no PR number is provided, and from the PR body when one
   is. Every candidate reference is validated at resolution
   — digits-only, positive range, same-repo — before any
   fetch, with multi-reference sources selecting the first
   valid reference in document order. A review-dispatch
   acquisition tool performs the resolution, criteria
   extraction, and tier detection; `/uf.review-council`
   Phase 1c Protocol 2 invokes it unconditionally in CODE
   review mode — the invocation itself discovers whether an
   originating issue resolves.
2. **Acceptance-criteria grounding.** The resolved issue's
   acceptance criteria are fetched, sanitized, and carried
   into reviewer prompts as bounded review context. The
   check records its grounding tier honestly: strict when
   the issue carries an explicit intake-kit provenance
   signal (a label or marked criteria section), best-effort
   semantic evaluation against whatever the issue says
   otherwise.
3. **Intent-satisfaction evaluation.** divisor-guard owns
   the judgment: evaluate each acceptance criterion against
   the diff and emit per-criterion findings that flow
   through the normal consolidation and verdict machinery.
   An unsatisfied criterion is a blocking finding.
4. **Deviation escape hatch.** When the change legitimately
   reveals the acceptance criteria were wrong, the check
   routes to governance (amend the PRD/issue) through a
   typed intent-deviation finding instead of silently
   passing or hard-failing — the review-council instance of
   the IMPLEMENTATION_DEVIATION typed interruption proposed
   in Discussion #444.

The design decision — where the check lives — is settled in
design.md: divisor-guard owns the evaluation, a
review-dispatch acquisition tool supplies the context, and
command prose invokes the tool to thread the
machine-readable state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `review-council`: gains intent-satisfaction requirements —
  originating-issue resolution from pipeline state, AC
  grounding tiers, divisor-guard evaluation, and the
  deviation escape hatch. The council protocol is cited
  normatively by `/uf.unleash` Step 6, so the threading
  contract reaches both commands through this capability.

### Removed Capabilities

None.

## Impact

- `.opencode/commands/uf.unleash.md` — Step 6 resolves the
  originating issue reference and forwards it into the code
  review dispatch.
- `.opencode/commands/uf.review-council.md` — Phase 1c
  Protocol 2 gains the pipeline-state input path and
  unconditional invocation in CODE review mode.
- `.opencode/skills/review-context/SKILL.md` — Protocol 2
  expansion (input sources, grounding-tier reporting).
- `.opencode/agents/divisor-guard.md` — intent-satisfaction
  evaluation item and the intent-deviation finding category.
- `.opencode/plugins/review-dispatch/` — the acquisition
   tool that resolves the issue reference, extracts and
   sanitizes the criteria, and detects the grounding tier,
   plus the plumbing that carries its output into dispatch
   session metadata and reviewer prompts (extent settled in
   design.md).
- Scaffold mirrors under `internal/scaffold/assets/` for
  every canonical asset touched, with drift-detection tests
  updated to match.
- Tests: plugin unit/integration coverage for threading,
  grounding-tier selection, and context delivery; a command
  eval fixture for the threaded path.
- AGENTS.md review-command documentation, plus the
  documentation issue required by the documentation gate
  (filed: #1207, unbound-force/website#449).
- Blog/tutorial: none warranted — the intent-deviation
  human gate is internal governance; #1207 records the
  tutorial/blog consideration.
- Instruction-file deltas (DE-004): expected net growth is
   about +10 lines in `uf.unleash.md` (Step 6 issue
   forwarding), +25 in `uf.review-council.md` (Phase 1c
   mandate and final-report sections), +15 in
   `review-context/SKILL.md` (Protocol 2 input sources and
   tier reporting), +20 in `divisor-guard.md` (evaluation
   item and deviation category), and +6 in `AGENTS.md`
   (review-command documentation); exact before/after line
   and token counts from `make lint-instructions` are
   recorded in the change record at implementation time.

## Constitution Alignment

Assessed against the Unbound Force org constitution
(`.specify/memory/constitution.md`, v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

The check communicates through existing artifacts —
branch-scoped checkpoint state, `.openspec.yaml`, dispatch
session metadata, and the persisted review-dispatch
artifact — not runtime coupling. Issue acceptance criteria
enter the review as bounded, sanitized, provenance-tracked
context.

### II. Composability First

**Assessment**: PASS

The council remains fully functional without an originating
issue: the check activates only when one resolves and skips
with an honest note otherwise. No hero gains a hard
dependency; intake-kit provenance is detected when present,
never required.

### III. Observable Quality

**Assessment**: PASS

The threaded issue reference, grounding tier, and
per-criterion outcomes are recorded as machine-readable
state in the dispatch artifact, giving each verdict
traceability from requirement to implementation.

### IV. Testability

**Assessment**: PASS

Every requirement ships with Given/When/Then scenarios.
Threading, grounding-tier selection, and context delivery
are covered by plugin tests and eval fixtures without
network dependencies — gh fetch failures degrade the check
to a documented best-effort path rather than blocking.

### V. Security by Default

**Assessment**: PASS

Issue bodies are untrusted input. The existing Protocol 2
sanitization controls — body truncation, same-repo
scoping, issue-count cap, digits-only validation — extend
to the new input path, and no new dependencies are
introduced.

### VI. Deterministic Execution

**Assessment**: PASS

The change applies the split the principle prescribes:
mechanical work (issue resolution, threading, AC
extraction, sanitization, tier detection) executes in
review-dispatch plugin tool code with unit tests — command
and skill prose only names and invokes the acquisition
tool; judgment (satisfaction evaluation, deviation
recognition) stays in the divisor-guard agent's prose
domain.
