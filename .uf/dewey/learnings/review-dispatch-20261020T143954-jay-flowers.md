---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T14:39:54Z
identity: review-dispatch-20261020T143954-jay-flowers
tier: draft
---

Multi-outcome tool handlers that emit per-item result records across many exit branches (e.g., review-dispatch recovery tools) should route every record through a single builder that owns the no-change defaults, passing overrides only for branches that differ. Hand-repeated result literals pass type-checking while permitting silent value corruption — a copied zero-count or a stale run_id type-checks fine and corrupts machine-readable summaries — and each repetition doubles the sync burden wherever a CI-enforced byte-identical scaffold twin exists. When extracting the builder, preserve the observable JSON contract exactly (field names, null/zero defaults, reason-string presence and absence) because outcome-pinning tests assert on substrings and key sets rather than deep equality. Reinforces learning/review-dispatch-20261016T222933-jay-flowers: deduplication refactors must close every drift vector, via compile-time sharing or a connecting producer-to-consumer test.
