---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-24T16:04:25Z
identity: review-dispatch-20261024T160425-jay-flowers
tier: draft
---

Anchoring a command input to its producer by reusing a broad existing context tool leaves an authority split that must be documented at the call site: uf.address-feedback §1.4 calls fetch_pr_review_context for its diff outputs only while §1.2/§1.3 remain the authoritative gh fetches for PR metadata and review feedback, so Phase 1 fetches PR state twice. The call-site authority note ("use the tool here for its diff outputs only") is the correct interim pattern — it stops later editors from treating the tool's other outputs as canonical or deleting the authoritative fetches — but the two fetches can observe different PR states if the PR advances between §1.2 and §1.4, and the never-re-fetch freeze policy bounds later divergence without reconciling that window. The DE-005-idiomatic end state is one intent-level call producing both the frozen input context and the diff (extend fetch_pr_review_context or add a per-PR cache destination variant), which eliminates the double fetch and the split authority in a single follow-up increment with existing test infrastructure.
