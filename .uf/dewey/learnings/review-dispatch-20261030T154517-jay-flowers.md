---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-30T15:45:17Z
identity: review-dispatch-20261030T154517-jay-flowers
tier: draft
---

Tool-layer durable identifiers deliver workflow reliability only when orchestration commands thread them. Verified during issue #872 triage (2026-10-30, unbound-force main): consolidate_dispatch and dispatch_status have accepted an optional explicit correlation_id since fix-review-dispatch-recovery (#751, RD-FR-027/design D3) and dispatch_review_runs has reported its minted correlation_id in its output summary since fix-review-dispatch-correlation-release (#794, task 2.2, index.ts ~5081) — yet no orchestration command instructs the agent to capture and forward it. uf.review-pr.md, uf.review-council.md, uf.triage-issue.md, uf.address-feedback.md, and uf.unleash.md all instruct "call consolidate_dispatch exactly once" relying on the in-process sessionCorrelationMap, so cross-process or restarted-session consolidation still fails not_found ("no dispatch session for this session", index.ts 3868/5241/5598). Rule: when a tool gains a durable identifier for cross-session addressability, every command orchestrating that tool must be updated in the same arc to capture the identifier from the tool's structured output and pass it on subsequent calls — otherwise the capability exists only for manual recovery operators.
