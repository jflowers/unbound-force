---
tier: validated
compiled_at: 2026-10-25T16:37:24Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - shield-constitution-from-force-20260814T213259-jay-flowers
  - constitution-alignment-20261012T000225-jay-flowers
  - constitution-amendment-20261014T123136-jay-flowers
  - constitution-alignment-20261015T234402-jay-flowers
  - constitution-alignment-20261015T234407-jay-flowers
  - constitution-check-20261015T234410-jay-flowers
  - constitution-20261020T001445-jay-flowers
  - constitution-alignment-20261022T180739-jay-flowers
  - constitution-20261023T171911-jay-flowers
topic: constitution
---

# Constitution

## Current State (October 2026)

### Version and Principles

- Org constitution is **v1.4.0**, amended 2026-10-14, with **six principles**: I Autonomous
  Collaboration, II Composability First, III Observable Quality, IV Testability,
  V Security by Default (added v1.3.0), VI Deterministic Execution (added v1.4.0).
- Every OpenSpec proposal's Constitution Alignment section MUST assess all six principles;
  the Compliance Review gate requires verification against "all active org principles".
  Re-derive the assessment from the current constitution version on every amendment — never
  from memory or a peer proposal's shape.
- Verification recipe: grep the active `.specify/memory/constitution.md` for `^### [IVX]+\.`
  headings to get the current principle count and names, then diff against the proposal's
  Constitution Alignment headings before treating the gate as complete. Record the
  constitution version next to the check so staleness is detectable later.
- Principle VI PASS claims require concrete evidence, not assertions: ground each PASS in
  the documented mitigation (identical enforcement command, checked-in values, absorbing
  margins, CI as platform confirmation) rather than denial that a risk exists. Reviewers
  should diff every PASS justification against the change's design risk register for
  contradictory overclaims.

### Hero Alignment and Supremacy

- Hero and site constitutions **extend** the org constitution; the org constitution
  **prevails on cross-cutting concerns** (Hero Constitution Alignment rule, v1.4.0).
- The website repo's constitution is now the scaffold-default org-style document
  (Autonomous Collaboration, Composability First, Observable Quality, Testability, Security
  by Default); the old website principles (Content Accuracy, Minimal Footprint, Visitor
  Clarity) survive only in historical spec artifacts.

### Amendment Path

- Amendments are exempt from the spec-workflow prerequisite but retroactively documented;
  they route through governance review, not ad-hoc edits.
- `shield-constitution-from-force`: agent sessions must not weaken constitution MUST rules
  under review pressure. The constitution file is protected from scaffold force-overwrites
  via a dedicated `isNeverOverwrite` classification, separated from `isToolOwned`
  (council-approved 2026-08-14; exact-string comparison is safe because `relPath` comes
  from `fs.WalkDir` on `embed.FS`, a binary-controlled input).
- Amendments adding a principle MUST sweep the constitution body AND README for hard-coded
  counts and enumerations in the same change — the SYNC IMPACT REPORT covers only the
  comment block. Grep ordinal count words ("four", "five", "six") and re-enumerate every
  principle list.

### Known Gaps

- `constitution-check.md:43/95` still enumerates "the four org principles" against the
  six-principle v1.4.0 constitution (open per the 2026-10-25 audit).
- Stale-template trap: proposals patterned on pre-amendment peers inherit a four-principle
  (I-IV) assessment shape; the newest principle is often the one a change most directly
  exercises.

## History

- **2026-08-14 — shield-constitution-from-force**: review council unanimous APPROVE
  (5 Divisor agents; 1 MEDIUM auto-fixed, 2 LOW); Architect scored 9/10 for the
  isToolOwned/isNeverOverwrite separation. Established the constitutional-shielding rule.
- **v1.3.0 — Principle V added (Security by Default)**: four-principle assessments became
  governance gaps; first found 2026-10-12 when templates and habits still assessed only
  I-IV (e.g., finale-token-reduction, created 2026-10-12).
- **2026-10-14 — v1.4.0 (1.3.1 → 1.4.0, Principle VI Deterministic Execution)**:
  amendment-sweep requirement discovered — Hero Constitution Alignment said heroes "MAY
  add principles beyond the five org principles" (stale once VI landed), and README.md
  still enumerated four while the live constitution had five.
- **2026-10-15 — drift cluster**: persist-unleash-summary, created one day post-amendment,
  assessed only I-IV although its design substantively addressed VI via tool extraction.
  Reliable pattern: a dedicated verification task enumerating I-VI
  (unleash-direct-review-dispatch task 7.1) plus a proposal section covering all six.
- **2026-10-20**: six-principle enumeration restated; Principle VI is often the strongest
  PASS to cite (emitter/validator unification is exactly Deterministic Execution) —
  omitting it forfeits the change's best alignment citation.
- **2026-10-22 — evidence rule**: ts-plugin-coverage-gate's Principle VI PASS ("same-commit
  coverage measurement is deterministic...") was contradicted by design.md's documented
  cross-platform V8 coverage divergence (macOS local vs ubuntu-latest CI — the class that
  forced a 0.5 epsilon in ci_crapload.yml) absorbed by a 1.18-point margin.
- **2026-10-23 — persistent drift**: rebase-upstream-before-push, nine days post-amendment,
  still assessed only I-IV while its design D2 cited the determinism gate as rationale for
  in-tool fetch (contrast: seam-verification assessed V and VI explicitly). The
  highest-risk window is the days just after an amendment.
- **2026-10-25 audit**: website constitution confirmed replaced by the scaffold-default
  org-style document; constitution-check.md's four-principle enumeration remains the
  known open gap.
