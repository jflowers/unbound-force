---
tag: advisor-host-model-fallback
author: jay-flowers
category: pattern
created_at: 2026-10-12T00:53:48Z
identity: advisor-host-model-fallback-20261012T005348-jay-flowers
tier: draft
---

When implementing a fallback path in dispatch_agent_run for advisor runs with null profile models, the key architectural insight is that only one source type (advisor) should trigger host-model resolution. Using strict string equality (=== "advisor") prevents other sources from accidentally falling through. The provenance shape for host-resolved advisors differs from both direct-model and tier-resolved runs: requested_model, provider, model_id, and variant are all null, while resolved_parent_model and resolved_parent_variant carry the host session's identity. This three-way provenance split (direct, tier-resolved, host-resolved) must be reflected in validateRunModel's validation branches.
