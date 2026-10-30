---
tag: openspec-tasks
author: jay-flowers
category: gotcha
created_at: 2026-10-29T13:28:16Z
identity: openspec-tasks-20261029T132816-jay-flowers
tier: draft
---

A tasks.md clause enumerating integration tests can be silently satisfied at a weaker test level while its checkbox reads [x]. In the derive-per-run-timeout change (PR #860), task 4.3's "per-entry tiers derive different bases" clause was covered only by resolveBaseWindowMs unit tests and planner LimitsSchema parsing; the dispatch integration suite carried zero references to per_run_timeout_tiers, because the unit suites already referenced the config key and the clause was mapped to the nearest existing coverage instead of the clause's stated test level. Verification technique: for each enumerated test clause, grep the suite at the clause's STATED test level for the clause's distinctive config tokens (here: per_run_timeout_tiers in dispatch-review-runs.test.ts returned zero matches while review-dispatch.test.ts and run-timeout.test.ts held all 12). A checkbox is a claim, not evidence.
