## Context

The `/review-pr` command contains inline context discovery
logic across ~100 lines (Steps 6, 6a, and Step 8 preamble)
that has been extracted into the `review-context` skill
(PR #303, issue #294). The skill provides four protocols:

1. Spec Artifact Discovery (branch name matching, PR
   description parsing, changed-file detection)
2. Issue Linking (regex parsing, validation, fetching,
   sanitization, acceptance criteria extraction)
3. Path-Based Focus Heuristics (file classification table)
4. Walkthrough Generation (per-file change summaries)

The `/review-pr` command already loads the `pre-flight`
skill at Step 4 using the established invocation pattern.
This change adds a second skill invocation at Step 6,
following the identical pattern.

## Goals / Non-Goals

### Goals

- Replace inline Steps 6/6a with a `review-context` skill
  invocation using the established `pre-flight` pattern
- Replace inline path heuristics and walkthrough generation
  in Step 8 preamble with a back-reference to the skill
  output from Step 6
- Update all forward references from "Step 6a" to
  "Step 6, Protocol 2" and "Step 6" throughout the command
- Update `/address-feedback` line 143 from "convention
  pack" fallback to hard skill dependency
- Mirror all changes to scaffold copies

### Non-Goals

- Modifying the `review-context` skill itself (owned by
  #294, already closed)
- Migrating `/review-council` (owned by #296)
- Adding new protocols or capabilities to the skill
- Changing convention pack loading (Step 7) — this is a
  separate concern from context discovery
- Adding graceful degradation / inline fallback

## Decisions

### D1: Hard dependency, no inline fallback

The `review-context` skill is a hard dependency. No
inline fallback logic is preserved when the skill is
absent.

**Rationale**: The `pre-flight` skill (the only other
skill consumed by `/review-pr`) uses the same pattern —
all three consumers (`/review-pr`, `/review-council`,
`/unleash`) treat it as a hard dependency with no
fallback. The skill is embedded in the scaffold and
distributed via `uf init`, making absence effectively
impossible. Adding a fallback would create a dual-path
maintenance burden and risk stale inline logic becoming
a silent security regression (per triage finding from
divisor-adversary).

### D2: Skill invocation at Step 6, not Step 5

The skill invocation replaces the current Step 6
(spec discovery) and Step 6a (issue linking). It is
placed after Step 5 (Fetch Diff) because Protocol 3
(Path-Based Focus Heuristics) needs the changed file
list from Step 2 metadata, and Protocol 1 (Spec
Discovery) may need to read spec content from the
saved diff (Step 5).

Convention pack loading (Step 7) stays as a separate
step because packs are a distinct concern — they
provide code quality rules, not context discovery.

### D3: Step 8 heuristics replaced with back-reference

The path-based focus heuristic table and walkthrough
generation instructions currently live in the Step 8
preamble (lines 422-453). These are replaced with a
compact back-reference to the skill output from Step 6,
not a second skill invocation.

**Rationale**: The skill is loaded once at Step 6. Its
output (file classifications, walkthrough summaries) is
consumed by Step 8. Invoking the skill again would be
redundant. The back-reference keeps Step 8 focused on
AI review logic while delegating classification to the
skill.

### D4: Behavioral parity, not expansion

This is a strict behavioral parity migration. The skill
reproduces the exact logic from `/review-pr`'s current
inline implementation. Protocol 4 (Walkthrough
Generation) adds explicit Markdown table templates but
the actual behavior is semantically identical.

**Rationale**: Per prior learning
`pre-flight-skill-20260623T123105`, skill extractions
must explicitly state whether the approach is "strict
parity" or "intentional expansion." This migration is
strict parity — the skill was designed as a 1:1
extraction verified by side-by-side comparison during
triage.

### D5: Forward reference updates are in-scope

All references to "Step 6a" throughout the command must
be updated to reference the new structure. Two known
locations:

- Line 463: `(Step 6a)` in acceptance criteria coverage
- Line 643: `Step 6a` in Linked Issues output section

These are updated as part of this change to avoid
leaving stale references to removed logic.

## Risks / Trade-offs

### R1: Skill loading adds one tool call

Loading the `review-context` skill adds one `skill`
tool invocation. This is the same cost as the existing
`pre-flight` skill load. The trade-off is a marginal
increase in tool calls for a significant reduction in
inline instruction size (~100 lines removed from
`/review-pr`).

### R2: Scaffold sync surface

Four files must be updated in lockstep. The drift
detection test (`TestEmbeddedAssets_MatchSource`)
catches mismatches at build time, mitigating the risk
of partial updates.

### R3: No automated behavioral regression test

These are Markdown prompt-engineering artifacts. There
are no unit tests for behavioral output. Verification
is manual — run `/review-pr` against a reference PR
before and after the change. This is the same risk
profile as the `pre-flight` skill extraction and is
accepted.
