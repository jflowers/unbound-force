---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-28T20:28:31Z
identity: review-dispatch-20261028T202831-jay-flowers
tier: draft
---

A review-council dispatch remains valid when a reviewer persona is excluded after repeated transient provider failures. Verified on port-uf-rebase-pr code review (2026-10-28): divisor-adversary failed repeatedly with transient provider errors and was excluded per RD-FR-025, while divisor-architect, divisor-curator, divisor-guard, and divisor-testing all succeeded; consolidate_dispatch still produced a legitimate APPROVE WITH ADVISORIES verdict with 6 non-blocking advisories recorded in the dispatch artifact. The lesson: a failed reviewer run does not by itself force an INCONCLUSIVE or UNAVAILABLE outcome — the RD-FR-025 exclusion path applies when the remaining personas provide successful assessments, and verdict validity comes from those successful runs, not from full persona attendance. Before re-dispatching a council that reports a persona failure, check the artifact's runs[] statuses; a single excluded persona with four successes is a completed review, not a failed one.
