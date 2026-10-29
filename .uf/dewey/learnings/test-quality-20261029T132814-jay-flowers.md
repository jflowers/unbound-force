---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-29T13:28:14Z
identity: test-quality-20261029T132814-jay-flowers
tier: draft
---

Enumerated integration-test requirements in tasks.md can be marked complete via level-substitution: a scenario listed under 'Add integration tests' gets covered by pure-function unit tests in a different suite, satisfying each wiring link individually while the composed path stays untested. Observed on opsx/derive-per-run-timeout task 4.3: 'per-entry tiers derive different bases' was satisfied by run-timeout.test.ts unit tests and review-dispatch.test.ts planner tests, while dispatch-review-runs.test.ts (the named integration suite exercising the actual call site) contained zero references to per_run_timeout_tiers. Verification rule: before marking an integration-test task checkbox complete, grep the named integration suite for each enumerated scenario's distinctive input (e.g., per_run_timeout_tiers in dispatch-review-runs.test.ts) — absence means the requirement was level-substituted, not delivered.
