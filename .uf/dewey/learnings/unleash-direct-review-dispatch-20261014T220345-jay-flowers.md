---
tag: unleash-direct-review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-14T22:03:45Z
identity: unleash-direct-review-dispatch-20261014T220345-jay-flowers
tier: draft
---

Delegating implementation tasks to cobalt-crush-dev child sessions on 2026-10-14 (branch opsx/unleash-direct-review-dispatch): 2 of 8 delegations returned completely EMPTY results having done nothing — no file edits, no git changes, just an empty task result. The pattern is intermittent (identical prompts succeeded on retry both times). Remedy that works: re-delegate with the same prompt plus the instruction "If you cannot complete the task, still return a report explaining what happened — never return an empty message", and always verify after each delegation by checking git diff or grepping for the task's signature strings before marking the tasks.md checkbox complete — never trust the child's claimed completion state, and never trust an empty result as a no-op success. Related environment pattern: enmaas/rits/zai-org/glm-5-3 standard-tier Divisor reviewer runs time out at the 600-second per-run limit in this environment (architect/curator/guard failed across three consecutive dispatches); failures are informational and non-voting, and the adversary run on google-vertex-anthropic/claude-opus-4-6 reliably succeeds, so one success still yields a valid verdict.
