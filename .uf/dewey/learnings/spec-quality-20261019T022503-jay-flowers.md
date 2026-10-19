---
tag: spec-quality
author: jay-flowers
category: pattern
created_at: 2026-10-19T02:25:03Z
identity: spec-quality-20261019T022503-jay-flowers
tier: draft
---

Spec deltas that mandate new tool-call steps should include failure-mode scenarios for those steps, not just happy-path data flows. In the fix-triage-issue-dispatch-docs review, the newly mandated no-provenance consolidate_dispatch retrieval call and the list_sessions + db_read_session transcript reads specified no behavior for call failure, empty payloads, or missing transcripts — the same class of gap (undocumented procedure forcing improvised agent behavior) that issue #735 documented for the original happy path. Pair every newly sanctioned tool call with: bounded-retry guidance where the call is side-effect-free, and an explicit degradation path (proceed with authoritative data, mark missing fields unavailable, record the gap) where the data source may be unavailable.
