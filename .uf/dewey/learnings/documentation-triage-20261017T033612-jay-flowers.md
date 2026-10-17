---
tag: documentation-triage
author: jay-flowers
category: pattern
created_at: 2026-10-17T03:36:12Z
identity: documentation-triage-20261017T033612-jay-flowers
tier: draft
---

In multi-round review-council feedback loops (uf.address-feedback), the Curator's documentation gate should be scoped to the cumulative feedback-fix diff's changed lines, not the parent PR: round 1 owns the full-PR documentation obligations (CHANGELOG entries, AGENTS.md/README impact, website docs issue), while feedback-fix rounds only verify resolution of round-1 doc findings and audit new lines. Behavior-preserving refactors mirrored byte-identically into internal/scaffold/assets (e.g., a single-source WORKFLOW_TIERS const deriving type unions and z.enum schemas, or an isRecord type-guard excluding arrays) deploy through `uf init` but change no user-observable behavior — they satisfy the documentation gate with the CHANGELOG entry plus mirror sync alone, and correctly trigger no website-docs issue, blog, or tutorial obligation. Cross-check the CHANGELOG's factual claims against the test assertions that pin the same contract (parameter lists, ceremony counts) before accepting the entry as complete.
