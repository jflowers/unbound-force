---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:50:35Z
identity: documentation-pipeline-20261025T185035-jay-flowers
tier: draft
---

Documentation-gate tracking issues go stale when later review-feedback commits redesign the mechanism the issue describes. PR #815 (unleash-build-test-fix-loop): unbound-force/website#322 was filed after council iteration 1 describing the fix-loop budget as "recorded in gate checkpoint data (`iteration` field)"; iteration 2's HIGH fix (the checkpoint tool zod-strips undeclared structured phase fields) migrated the budget to gate-distinct free-form data keys (data.fixLoopPhase[N], quick-fix-budget/data.fixLoopQuick, data.fixLoopPreflight), scaffold_test.go now pins "iteration:" absent, and the CHANGELOG/command/mirror were all synced — but the issue body was never re-verified, leaving the work order that scopes the website documentation instructing a mechanism the repo's own tests forbid. Recipe: when a review-feedback fix changes a mechanism a filed docs/blog/tutorial issue describes, re-verify that issue's body (field names, key names, thresholds) in the same commit that updates the CHANGELOG — treat filed tracking issues as a fourth surface in the command/mirror/CHANGELOG claim-sync grep (extends documentation-pipeline-20261019T202640), and cite the tracking-issue number in the fix commit so the sync is auditable.
