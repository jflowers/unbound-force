---
tag: review-accuracy
author: jay-flowers
category: gotcha
created_at: 2026-10-14T18:13:15Z
identity: review-accuracy-20261014T181315-jay-flowers
tier: draft
---

When a spec, proposal, or CHANGELOG makes a precise count claim (e.g., fix-tui-git-output-leak's "18 calls in uf-workflow and 32 in uf-finale, 50 per tree"), verify by recounting per-handler from the actual diff before reporting a discrepancy. Handler-level heterogeneity makes mental aggregate counts easy to get wrong by one: in uf-finale, commit_context's catch block had no console.error while every other handler's catch did, and an initial aggregate recount that assumed uniform catch-side logging produced a false 33-vs-32 mismatch. The authoritative check for a removal claim is the absence check (grep for zero remaining occurrences), which is independent of the count and already decisive — only file a count-accuracy finding when the per-handler recount is done exhaustively against the diff.
