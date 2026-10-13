---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-11T23:24:47Z
identity: review-dispatch-20261011T232447-jay-flowers
tier: draft
---

Spec changes introducing new valid states require consumer audit. When a spec adds a new valid state (e.g., model:null for advisor runs with empty profiles), every consumer of that state must be audited to ensure it handles the new value correctly. In the case of dispatch_agent_run, the profilePair() function was updated to return null models for empty profiles, but the calling code was not updated to fall through to resolveHostModel().
