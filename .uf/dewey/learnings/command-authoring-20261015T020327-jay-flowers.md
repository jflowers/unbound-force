---
tag: command-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-15T02:03:27Z
identity: command-authoring-20261015T020327-jay-flowers
tier: draft
---

Per-invocation count qualifiers in command prose must be scoped to the attempt whenever the surrounding procedure has re-run or iteration semantics. In opsx/unleash-direct-review-dispatch (PR #729), Steps 4/6 of uf.unleash.md prescribe "Call `dispatch_review_runs` exactly once" while the same sections mandate fix-iteration re-runs that invoke the tool again, and the adjacent consolidate_dispatch instruction correctly says "exactly once per finalization attempt". An unqualified "exactly once" literally contradicts the re-run loop it sits inside — the same directive-contradiction genus as the security-gate-delegation pattern. When adding iteration/retry semantics to a procedure, audit every count qualifier in the procedure for per-attempt scoping.
