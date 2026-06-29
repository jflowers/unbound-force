## Why

The `/review-pr` command (992 lines) contains inline logic
for spec artifact discovery (Step 6), issue linking with
input sanitization (Step 6a), and path-based focus
heuristics with walkthrough generation (Step 8 preamble).
This logic is duplicated in concept across `/review-pr`,
`/address-feedback`, and `/review-council`.

Issue #294 (closed, PR #303) created the `review-context`
skill at `.opencode/skills/review-context/SKILL.md` which
extracts this shared logic into four reusable protocols.
This change migrates `/review-pr` to consume the skill
instead of inlining the logic — the consumer side of the
#176 decomposition (#294 producer, #295 consumer, #296
review-council consumer).

## What Changes

Replace inline context discovery logic in `/review-pr`
with a `review-context` skill invocation, following the
same pattern established by the `pre-flight` skill
(Step 4). Update forward references throughout the
command, and update the `/address-feedback` terminology
from "convention pack" to "skill".

## Capabilities

### New Capabilities

- None. This is a refactoring — no new user-facing
  behavior.

### Modified Capabilities

- `/review-pr` Step 6: Inline spec discovery and issue
  linking replaced by `review-context` skill invocation
  (Protocols 1 and 2). Behavioral parity — the skill's
  logic is a 1:1 extraction of the current inline logic.
- `/review-pr` Step 8 preamble: Inline path-based focus
  heuristics and walkthrough generation replaced by
  back-reference to skill output (Protocols 3 and 4).
- `/address-feedback` Step 2.1 item 6: Forward reference
  updated from "convention pack" fallback to hard skill
  dependency.

### Removed Capabilities

- Inline spec discovery logic (Steps 6, 6a): Removed
  from `/review-pr`, now provided by skill Protocol 1
  and Protocol 2.
- Inline path heuristic table and walkthrough generation
  instructions: Removed from Step 8 preamble, now
  provided by skill Protocols 3 and 4.
- Graceful degradation for absent skill: Not implemented.
  The skill is a hard dependency, consistent with
  `pre-flight` skill consumption. The skill is embedded
  in the scaffold and shipped via `uf init`.

## Impact

**Files modified** (4 total, 2 live + 2 scaffold copies):

| File | Change |
|------|--------|
| `.opencode/commands/review-pr.md` | Replace Steps 6/6a with skill invocation; replace Step 8 heuristics/walkthrough with back-reference; update forward references |
| `internal/scaffold/assets/opencode/commands/review-pr.md` | Mirror of above |
| `.opencode/commands/address-feedback.md` | Update line 143 terminology |
| `internal/scaffold/assets/opencode/commands/address-feedback.md` | Mirror of above |

**No Go source changes.** No CI changes. No schema
changes. The scaffold drift detection test
(`TestEmbeddedAssets_MatchSource`) validates sync
automatically.

**Related issues**: Fixes #295. Part of #176
decomposition.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent command files (prompt
engineering artifacts). It does not affect inter-hero
artifact exchange formats or communication patterns.

### II. Composability First

**Assessment**: PASS

This change improves composability by extracting shared
logic into a reusable skill. The `review-context` skill
provides a single source of truth for context discovery
that multiple commands can consume independently. The
skill is embedded in the scaffold and distributed via
`uf init`, ensuring availability without cross-repo
dependencies.

### III. Observable Quality

**Assessment**: N/A

This change does not affect machine-parseable output
formats or provenance metadata. The review output
structure (walkthrough table, linked issues section,
findings) remains unchanged.

### IV. Testability

**Assessment**: PASS

The scaffold drift detection test
(`TestEmbeddedAssets_MatchSource`) validates that live
command files and scaffold copies stay in sync. The
`review-context` skill's logic is a 1:1 extraction of
the current inline logic, verified by side-by-side
comparison during triage. Behavioral verification is
manual (run `/review-pr` against a reference PR before
and after the change).

### V. Security by Default

**Assessment**: PASS

Input sanitization controls (regex validation, positive
integer validation, same-repo URL scoping, 5-issue
fetch limit, 2000-character body truncation) are
preserved in the skill's Protocol 2. The skill is the
single source of truth for these controls, eliminating
the risk of drift between duplicated inline
implementations.
