---
tag: seam-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-23T20:21:04Z
identity: seam-verification-20261023T202104-jay-flowers
tier: draft
---

A fix commit that hardens a tool's failure envelope with a new error code must wire the consumption side in the same increment: the command file's branch for that code (plus its scaffold mirror) and, where the spec enumerates failure scenarios, a matching scenario — otherwise the hardened failure mode arrives as an orphaned contract branch. Verified on rebase-upstream-before-push (unbound-force/unbound-force PR #812, 2026-10-23): fix commit 8359baa added the retryable BASE_SYNC_COUNT envelope to uf_finale_base_state with unit tests, but /uf.finale step 4 branches only on BASE_SYNC_FETCH and the finale-base-sync spec's only failure scenario is "Fetch fails offline". An agent receiving BASE_SYNC_COUNT falls through to the command's generic "if any step fails, stop" guardrail, which blocks the finale on a freshness check the same step says must never block. Recipe: when adding or hardening a failure-envelope code on a tool a command consumes, grep the consuming command file and spec for that tool's existing failure codes and extend every branch list in the same edit; treat an emitted-but-unconsumed code as an incomplete fix, not a defensive improvement.
