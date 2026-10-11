---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-11T22:56:10Z
identity: review-dispatch-20261011T225610-jay-flowers
tier: draft
---

When adding mode-dependent Zod superRefine validation to multiple schemas that share the same optional fields and mutual-exclusivity constraints, extract the refinement logic into a shared helper function (e.g., `addTriageModeRefinement(data, ctx)`) rather than duplicating the block. This is especially important when the schemas are in the same file and the validation logic is byte-identical. The `plan_review_dispatch` PlanInputSchema (lines 319-337) uses a similar but not identical pattern, confirming this is a recurring cross-schema concern in the review-dispatch plugin.
