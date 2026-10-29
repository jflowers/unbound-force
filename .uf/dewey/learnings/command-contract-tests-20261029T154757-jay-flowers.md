---
tag: command-contract-tests
author: jay-flowers
category: pattern
created_at: 2026-10-29T15:47:57Z
identity: command-contract-tests-20261029T154757-jay-flowers
tier: draft
---

When a review-feedback fix is chosen because it preserves every existing structural pin (no pin changes required), the fix's own mechanism ships with zero regression protection. Extend the pin suite in the same commit: enumerate the fix's normative additions — new marker fields, new checkpoint write shapes, new recovery branches, new early-exit paths — and add one bounded clause pinning them. Deriving the clause inventory from the pre-fix task list guarantees the post-fix mechanism is unpinned; re-derive from the post-fix normative text (design decisions plus command prose) instead.
