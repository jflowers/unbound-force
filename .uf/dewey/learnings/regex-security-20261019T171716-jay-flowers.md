---
tag: regex-security
author: jay-flowers
category: pattern
created_at: 2026-10-19T17:17:16Z
identity: regex-security-20261019T171716-jay-flowers
tier: draft
---

When a regex grammar change unifies two previously divergent patterns into one shared constant, the security review should verify three properties beyond functional correctness: (1) ReDoS resilience — confirm that lazy quantifiers inside negated character classes (e.g., `[^\]]*?`) have an unambiguous exit character, preventing catastrophic backtracking on adversarial input; (2) state isolation — confirm that a `g`-flagged regex used only via per-line `String.matchAll` cannot leak `lastIndex` state across iterations (matchAll creates a fresh iterator per call); (3) round-trip integrity — confirm that the extraction helper and the replacement function use the same question-derivation path, so a scanned question always matches exactly one marker for resolution. The CLARIFICATION_MARKER_PATTERN superset grammar satisfies all three: the `]` exclusion in `[^\]]*?` gives the engine an unambiguous exit, per-line matchAll isolates state, and both scan and replace call `extractClarificationQuestion(match)` for question derivation.
