---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-26T10:51:39Z
identity: documentation-gate-20261026T105139-jay-flowers
tier: draft
---

A documentation-gate record's website-coverage fold claim must be re-verified against the website repo's live open issues at review time, by keyword search rather than label filter. In PR #837 (spawn-subtask-classification-params, unbound-force/unbound-force), the Task 4.2 record and gate issue #834 asserted the spawn-tool website coverage folded into unbound-force/website#317 ("no new website issue"); in fact unbound-force/website#329 — filed the same day from the parallel tool-side replicator#143 workflow, tracking the identical forge_spawn_subtask contract (task_classification/skill/skill_absent_reason, failure codes) — was open, unlabeled, and unlinked from both the record and #317. Fold rationales go stale the moment a parallel workflow files an on-point tracker. Child reviewers cannot file or edit issues, so the verification path is: keyword-search the website repo's open issues for the contract's parameter and tool names (label filters also miss unlabeled issues like #329), then check each hit's scope against the fold claim before treating the cross-repo gate as satisfied.
