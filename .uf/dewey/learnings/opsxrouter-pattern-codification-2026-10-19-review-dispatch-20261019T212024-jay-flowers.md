---
tag: opsxrouter-pattern-codification-2026-10-19-review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-19T21:20:24Z
identity: opsxrouter-pattern-codification-2026-10-19-review-dispatch-20261019T212024-jay-flowers
tier: draft
---

During the opsx/router-pattern-codification pipeline (2026-10-19), the Divisor review-dispatch session froze its immutable metadata at the FIRST dispatch_agent_run call of the session. Because /uf.unleash ran the spec review (mode specs, head 1bfd3637) before implementation moved HEAD, the later code review (mode code, head b81212b4) could not be finalized through consolidate_dispatch — it failed with "artifact commit must equal the immutable reviewed head SHA" even though all runs were valid. Recovery that worked: call consolidate_dispatch with no provenance to retrieve the stored payload, then call finalize_review_dispatch directly with the payload corrected to the true dispatch-time metadata (mode, input_context head_sha, change_profile, coverage) and a FRESH correlation_id so the earlier spec-review artifact is not clobbered. Two payload quirks: the finalize schema rejects the "read_only" key that dispatch_status returns inside runs entries (strip it from every run), and the provenance commit must equal the corrected payload input_context.head_sha. The final artifact then persists normally and uf_unleash_detect_resume can derive code-review completion from it.
