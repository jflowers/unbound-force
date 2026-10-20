---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:14:50Z
identity: review-dispatch-20261020T001450-jay-flowers
tier: draft
---

When a bugfix aligns an emitter with its validator by sharing one derivation function, acceptance criteria claiming output invariance (e.g., "byte-identical on every input") must be scoped to inputs where the previous behavior was observable. Inputs that previously failed closed (validation mismatch, no persisted artifact) have no prior output to preserve, and known contamination defects in the old derivation (e.g., review-dispatch issue #751: failed-run findings entering the consolidated severity ladder because deduplicateFindings has no status filter) silently violate the universal claim. State the invariance over the clean input class and name the contaminating defect as the tracked exception; otherwise the requirement is knowingly false and can mislead implementers into preserving the contaminated behavior.
