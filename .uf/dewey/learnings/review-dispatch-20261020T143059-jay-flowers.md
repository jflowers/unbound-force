---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T14:30:59Z
identity: review-dispatch-20261020T143059-jay-flowers
tier: draft
---

Recovery requirements stated as outcome guarantees must gate success on the outcome state itself, not on an enumerated list of failure causes. In redispatch_failed_runs, success was gated on runData !== null — an in-memory proxy — while the actual guaranteed outcome (a persisted, discoverable run file) was never verified. Cause-enumeration gates (null checks, try/catch on known failure paths) silently miss unmodeled causes, such as swallowed persistence errors in a downstream helper. When a spec scenario reads "X MUST be restored/verified," the code should assert X directly (stat/read-back of the persisted artifact) rather than infer it from intermediate signals. In this codebase specifically: any code path that reports a run as recovered, redispatched, or discarded should verify the run-*.json file state on disk before emitting a success outcome.
