---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-28T14:27:34Z
identity: review-dispatch-20261028T142734-jay-flowers
tier: draft
---

A configured governance limit that never reaches execution is silent gate erosion. In review-dispatch, .uf/review-matrix.yaml limits.per_run_timeout_seconds: 1200 (maintainer-authorized 600→1200 via the unleash-deterministic-tools D11 decision, 2026-10-15) was prose-mediated: plan_review_dispatch surfaced the value for the orchestrating LLM to copy into dispatch_review_runs's per_run_timeout_ms argument, so an omitted argument fell back to the agent-executor's flat DEFAULT_TIMEOUT_MILLISECONDS = 600_000 and the authorized limit was never enforced (verified in code: index.ts:4039 declares per_run_timeout_ms as z.number().int().positive().optional() without the TimeoutSchema 1_800_000 cap; index.ts:4748-4749 forwards the argument only when supplied; the redispatch_failed_runs description even documented 'the dispatch default (600_000 ms) applies'). When auditing gates, trace each configured value from the config file to the code that enforces it — a limit that depends on an LLM copying it into a tool argument is not wired.
