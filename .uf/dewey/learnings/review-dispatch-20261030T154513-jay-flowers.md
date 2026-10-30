---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-30T15:45:13Z
identity: review-dispatch-20261030T154513-jay-flowers
tier: draft
---

A durable-ID escape hatch on a consumer tool is incomplete until every orchestration caller threads the producer's returned ID — infrastructure capability and caller integration are separate increments that must both be audited. In the unbound-force review-dispatch plugin, consolidate_dispatch has accepted an optional explicit correlation_id since the #751 recovery design (D3, same-session map kept as convenience fallback), and dispatch_review_runs has returned its minted correlation_id on every post-validation path since the #794 latest-dispatch change, yet /uf.review-pr still invoked consolidate_dispatch without forwarding it, so dispatch/consolidation split across plugin processes or tool sessions failed with "no dispatch session found for this session" (issue #872). Pattern: when a tool gains a durable-ID parameter, audit all producer→caller→consumer chains in the same increment; treat the in-memory session map as a same-session convenience fallback only, never the mechanism of record for cross-session retrieval.
