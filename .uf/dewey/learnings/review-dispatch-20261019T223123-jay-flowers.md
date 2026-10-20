---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T22:31:23Z
identity: review-dispatch-20261019T223123-jay-flowers
tier: draft
---

Recovery tools that rewrite persisted data files (discard_orphaned_submissions) should consider using the write-to-temp-then-rename pattern for atomicity, especially when the rewrite is operator-initiated and the original data is irrecoverable after a partial write. The pre-existing non-atomic writeFile pattern in dispatchAgentRun is acceptable for fresh writes (the in-memory result is authoritative), but rewrites of existing audit-trail data have a higher cost of corruption. The redispatch_failed_runs tool already uses rename for its archive step, establishing the atomic-move precedent within the same change.
