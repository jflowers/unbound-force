---
tier: validated
compiled_at: 2026-10-25T16:32:18Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - schema-design-20261009T171028-jay-flowers
  - spec-retroactive-amendment-20261012T145521-jay-flowers
  - spec-codification-20261015T161947-jay-flowers
  - spec-quality-20261016T151130-jay-flowers
  - spec-authoring-20261017T222148-jay-flowers
  - spec-authoring-20261017T234712-jay-flowers
  - spec-authoring-20261017T234720-jay-flowers
  - spec-quality-20261019T022503-jay-flowers
  - spec-authoring-20261019T223559-jay-flowers
  - spec-authoring-20261019T223601-jay-flowers
  - spec-authoring-20261019T223602-jay-flowers
  - spec-quality-20261020T001110-jay-flowers
  - spec-authoring-20261020T001113-jay-flowers
  - spec-authoring-20261020T125026-jay-flowers
  - spec-quality-20261020T125035-jay-flowers
  - spec-authoring-20261020T161831-jay-flowers
  - spec-authoring-20261020T161833-jay-flowers
  - spec-authoring-20261022T180323-jay-flowers
  - spec-authoring-20261022T200531-jay-flowers
  - spec-authoring-20261022T200536-jay-flowers
  - spec-authoring-20261022T205120-jay-flowers
  - spec-authoring-20261023T114007-jay-flowers
topic: spec-authoring
---

# Spec Authoring

## Current State (October 2026)

### Enumeration discipline

One canonical source per enumeration. Token lists restated across requirement prose, scenario regexes, and
task check lists drift token-by-token, and the regex is the acceptance test — a drifted regex silently
under-checks rather than failing loudly (command-prose-pilot: the ban list appeared five times; the scenario
regex dropped "terminate" while the prose kept it). Derive every restatement from one canonical list and
mechanically diff them; count divergence is the aggregate form ("2 defects" vs "3 corrections").

A fix for a flagged validation mismatch must re-derive validation from the requirement's complete clause
set — enumerate every normative clause, map each to a validation command, diff against all existing
validations — since patching the symptom left a sibling phrase ban with no scenario or task check.

Drift runs in both directions: token lists drift between artifacts, and applicability scope drifts between
a standard's generic scenarios and a pilot's conformance subset — record excluded requirements and why
when a pilot scopes down, or later reviewers false-positive against preserved behavior.

Codifying a manual procedure into a spec: diff the codified rule against the recipe it replaces — implicit
conditions drop silently. "Most recent artifact records an approving verdict" lost branch matching and
head-SHA recency; dispatch artifacts live in a flat repo-global directory, so another branch's approving
artifact falsely marks review steps done. Completion evidence MUST pin branch and head-SHA matching.

Input contracts: prefer discriminated unions or mode-conditional optional fields over uniform required
fields in multi-mode aggregate tools. For enum-coupled parameters, enumerate cross-field validation across
every combination of optional parameters, and audit fixed output wording restating an input field's value.

### Inventory verification

Verify inventories against the working tree at authoring time — file:line spans, helper names, call-site
shapes (a cited uf.unleash.md span was the adjacent rendered-shape block; an "executeTool" precedent was
actually invokeTool). Prefer marker-string text anchors over line numbers when pinning command-document
spans; text anchors survived where line-number and helper-name citations drifted.

Before writing a delta that modifies a tool's input contract, grep the command templates for the tool name
and classify every call site by shape — command-path, prompt-only, alternate delegation paths (e.g.
replicator subtask spawn); a one-minute grep falsifies the inventory before it hardens into requirements.
Coverage-gap claims ("currently unpinned") must be verified against the base commit by reading cited test
files in full — landed changes may already deliver the coverage (#765; naming an existing variable while
claiming it does not exist is the telltale). The glob tool fails silently on absolute paths containing
'@' (this workspace's path includes one) — use directory reads there; prefer repo-relative paths.

### Delta-stacking rules

MODIFIED-delta stacking is one-level absorption and archive-order-fragile: application replaces
requirements by name and `openspec validate` passes regardless of ordering, so a delta drafted against an
older baseline absorbs only the immediately-prior delta's text — no archive order produces the full union
(PR #793: three stacked deltas on one requirement; one order silently drops the classification contract).
Enumerate sibling deltas for the same capability and requirement, base replacement text and the
"Previously:" paragraph on the latest accumulated state, absorb the FULL chain, record the archive-order
constraint in design.md Risks, or prefer all-ADDED deltas (append semantics, order-tolerant).

Standing requirements MUST NOT pin mutable artifact values as eternal assertions ("MUST be 1.1.0" is
falsified by the next coordinated bump). Phrase version changes as change-scoped bump directives or
floors, and keep exact-value checks inside the change's own verification scenario.

Sibling amendments: when one change amends a pending sibling, reconcile ALL of the sibling's artifacts —
proposal, design, specs delta, tasks — and verify "recorded in both changes" claims against its actual
content; a prose claim with no reciprocal artifact is a false anchor that archives permanently. After any
fix round that alters a MUST-level rule, grep both changes' artifacts for the old rule's distinguishing
tokens; numbering-scheme canonicalizations must sweep every consumer.

Proposals are living artifacts until archive: when a design decision reverses a mechanism the proposal
names, update every passage describing it (What Changes, Constitution Alignment) in the same commit, or
proposal-first readers inherit a wrong model of the delivered design.

### Marker grammar

One shared grammar for spec.md clarification markers: colon, bare-with-text, and completely bare forms all
extract as questions; pluralized or unterminated marker-like text is ignored by design. Codified in
AGENTS.md. Well-formed marker syntax extracts as a question even in documentation — quoted, fenced, or
prose — so avoid literal marker syntax in prose.

### Conventions

RFC 2119 keywords (MUST/SHOULD/MAY), Given/When/Then scenarios, FR-NNN numbering, line length under 72.
Never retroactively amend ratified specs to match a code change — create a new spec or OpenSpec change
justifying the behavior and leave the originals as point-in-time design records.

Deltas mandating new tool-call steps need failure-mode scenarios, not just happy paths: bounded-retry
guidance for side-effect-free calls, explicit degradation (proceed with authoritative data, mark fields
unavailable, record the gap) for unavailable sources. Prose exclusions are unenforceable when the mandated
detector's grammar cannot distinguish the excluded class (issues and PRs share one number space) — pin the
real behavior, including collision outcomes, with a scenario or test; only a pinned scenario makes the
outcome a contract.

Governance changes spanning repo-local artifacts and scaffold-embedded mirrors must keep scaffolded
sources self-describing: repo-local packs and skills do not ship via uf init, so rule-ID citations dangle
downstream. Reconcile spec/learning contradictions before merge (amend overstated guards — "drift would
surface as a tsc failure" against tsc-silent drift — or add supersession notes). When a fix extracts one
procedure into a tested tool, sweep sibling procedures in the same requirement — partial extraction
leaves the class unenforced.

## History

- Grammar evolution — divergent per-artifact clarification-marker grammars converged into one shared
  superset (colon, bare-with-text, completely bare all extract as questions), codified in AGENTS.md.
- Oct 9-12 — single-artifact findings: union schemas for multi-mode tools; retroactive-amendment ban.
- Oct 15-17 — codification and enumeration failures: implicit conditions dropping (branch/head-SHA
  matching); command-prose-pilot's five-way ban-list drift with the regex silently under-checking; count
  divergence (2 vs 3); the symptomatic fix leaving a sibling clause unvalidated; bidirectional drift.
- Oct 19-20 — inventory drift: file:line and helper-name citations wrong while text anchors survived;
  coverage-gap claims falsified by existing tests (#765); mutable values pinned in standing requirements;
  proposal/design divergence after mid-change reversals; sibling reconciliation and old-rule token sweeps.
- Oct 22-23 — MODIFIED-delta absorption findings: #787 exposed call-site inventory gaps and the repo-local
  vs scaffold-embedded citation boundary; PR #793 verified one-level absorption and archive-order
  fragility, yielding the full-chain, design-Risks, all-ADDED rules.
