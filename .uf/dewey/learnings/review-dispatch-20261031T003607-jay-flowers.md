---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-31T00:36:07Z
identity: review-dispatch-20261031T003607-jay-flowers
tier: draft
---

Persistent adversary infra failure pattern in review dispatches (unbound-force, 2026-10-30/31, branch opsx/forward-aggregate-correlation-id): divisor-adversary dispatched at heavy tier with model google-vertex-anthropic/enmaas/rits/zai-org/glm-5-3 fails INSTANTLY (started→finished within ~50ms, usage null) with child_prompt_failed "Unexpected server error" (refs err_b77ca3c9/err_3b4e63d2/err_2a2ebb48/err_9153d45e across 5 attempts), marked retryable:true but never recovering — the child-session creation route for that model slug is broken, not transient. Both code-review dispatches consolidated cleanly at 4/5 success (architect/curator/guard/testing all APPROVE) with the adversary excluded per RD-FR-025. Recovery rule: after ~3 identical instant failures, stop redispatching, record the infra failure in the council-verdict checkpoint, and let consolidation exclude it — quorum is reachable without burning more attempts; the standard-tier enmaas model slug works fine.
