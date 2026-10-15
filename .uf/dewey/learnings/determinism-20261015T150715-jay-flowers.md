---
tag: determinism
author: jay-flowers
category: pattern
created_at: 2026-10-15T15:07:15Z
identity: determinism-20261015T150715-jay-flowers
tier: draft
---

In multi-increment instruction-to-tool migrations (extracting mechanical prose into executable plugin tools), converge on a single tool-result consumption notation before the second increment ships, because each merged increment becomes the copy-source precedent for the next. Observed in the deterministic-instruction migration: increment 1 (uf.finale.md §3) renders the tool output shape inline ("Call `uf_finale_commit_context` with your raw model ID → `{diffStat, recentLog, normalizedModel}`"), while increment 2 (uf.address-feedback.md Phase 4.2, openspec/changes/address-feedback-model-normalization) names the consumed field in prose ("Use the returned `normalized` value") without the shape. Both satisfy DE-002's preserved decision-point example, but the notation divergence compounds if increment 3 copies either form. Prior learning token-reduction-20261013T021613-jay-flowers already records that consuming agents benefit from seeing the output shape at the consumption site (commit-message generation specifically). Recommendation: adopt the arrow-notation form ("Call <tool> with <input> → `{consumed fields}`") as the standard template for future increments. (Provenance: branch opsx/address-feedback-model-normalization, 2026-10-15, /uf.unleash code review; proposed by divisor-architect.)
