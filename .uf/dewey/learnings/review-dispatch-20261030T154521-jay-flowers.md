---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-30T15:45:21Z
identity: review-dispatch-20261030T154521-jay-flowers
tier: draft
---

When a slash command chains an aggregate dispatch tool to a consolidation/retrieval tool (dispatch_review_runs → consolidate_dispatch), the command prose must instruct capturing the durable correlation_id from the dispatch result and passing it to the retrieval call. The plugin's in-memory sessionCorrelationMap only bridges calls executing in the same opencode plugin process; across processes or tool sessions the no-provenance consolidate_dispatch retrieval fails with "no dispatch session found for this session", and uf.review-pr.md Section 5a treats that as a permanent fail-closed failure — converting a by-design recoverable state (the explicit correlation_id read path landed with the #751 recovery work) into a hard stop. As of issue #872 triage (2026-10-30), the same no-forwarding consolidation pattern exists in uf.review-council.md, uf.triage-issue.md, uf.address-feedback.md, and uf.unleash.md; a fix should cover all five commands or explicitly scope the remainder as follow-up.
