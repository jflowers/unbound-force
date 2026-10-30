---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-30T15:45:11Z
identity: review-dispatch-20261030T154511-jay-flowers
tier: draft
---

Durable-handle plumbing needs consumer-side completion, and the consumer may be command markdown, not code. In unbound-force's review-dispatch plugin, #751 added explicit correlation_id resolution to consolidate_dispatch (precedence over the in-memory sessionCorrelationMap) and #794 made dispatch_review_runs mint and report a per-invocation correlation_id in its prose summary — yet /uf.review-pr (issue #872) still called consolidate_dispatch without the ID, so cross-session consolidation failed closed as not_found ("no dispatch session for this session") because resolution fell back to a module-level Map that is empty in a different plugin process or tool session. Audit pattern: when a tool chain gains a durable handle to remove runtime coupling, grep the orchestration layer — including the command/prompt files that drive the agent, not just programmatic glue — for the handle name to find unthreaded consumers; a shipped mechanism with zero consumers is indistinguishable from a regression.
