---
tag: openspec-tasks
author: jay-flowers
category: gotcha
created_at: 2026-10-28T17:27:49Z
identity: openspec-tasks-20261028T172749-jay-flowers
tier: draft
---

In tasks.md files using the "[P] marks parallel-eligible; tasks without [P] run sequentially first, then [P] tasks run in parallel" convention, de-parallelizing only the dependent task of a write-conflicting pair inverts the required execution order: the non-[P] dependent is scheduled BEFORE the [P] task it depends on. When task B must write into an artifact task A creates (e.g., recording a rationale in a CHANGELOG entry A adds), BOTH tasks must be non-[P] and listed in dependency order (A then B) — removing [P] from B alone runs B first. Observed in openspec/changes/derive-per-run-timeout phase 8: task 8.3 (records the documentation-gate exemption rationale into the CHANGELOG entry) was de-parallelized while 8.2 (creates that entry) stayed [P], so the header rule orders 8.3 before 8.2.
