---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:14:46Z
identity: review-dispatch-20261020T001446-jay-flowers
tier: draft
---

When one tool both emits and validates a derived field (e.g., consolidate_dispatch emits workflow_result.value and finalize_review_dispatch recomputes it), the emitter and validator must share a single derivation function. Divergent derivations over persisted, deterministic inputs produce payloads that can NEVER pass validation — mechanical-retry budgets are structurally doomed and the workflow fails closed with no artifact (issue #764: severity-ladder emission vs vote-based validation on split feedback panels, rejected 3x identically on PR #761). The durable fix pattern, established by dispatch-finalize-determinism and repeated here: fix the emitter to call the validator's exact derivation function, never relax the validator — the validator's documented contract stays authoritative and emission becomes valid by construction.
