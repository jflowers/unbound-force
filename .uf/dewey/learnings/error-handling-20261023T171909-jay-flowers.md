---
tag: error-handling
author: jay-flowers
category: gotcha
created_at: 2026-10-23T17:19:09Z
identity: error-handling-20261023T171909-jay-flowers
tier: draft
---

When a tool returns a success envelope with default-zero numeric fields that a consumer uses for branching (e.g., behindBy: 0 → skip gate), silent catch-to-zero on the computation path creates a false-negative: the consumer cannot distinguish 'genuinely zero' from 'count failed.' The safe pattern is to either (a) return a failure envelope when the count is essential to the decision, or (b) include a nullable/optional field (e.g., behindBy: number | null) so the consumer can distinguish 'zero' from 'unavailable' and apply a safe default. Verified on rebase-upstream-before-push (unbound-force/unbound-force, 2026-10-23): uf_finale_base_state's rev-list catch blocks default aheadBy/behindBy to 0 inside a success envelope, causing the command's behindBy-0 path to skip the sync gate entirely when the count actually failed.
