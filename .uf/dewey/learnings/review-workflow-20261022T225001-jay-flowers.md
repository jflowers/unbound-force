---
tag: review-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:50:01Z
identity: review-workflow-20261022T225001-jay-flowers
tier: draft
---

Iterative review loops that support human overrides need an override-carryforward rule for re-review iterations: findings matching a recorded override (same file and root cause) must carry forward as resolved when applied fixes trigger a re-run, and the checkpoint overrides array must accumulate across iterations. Without this rule, fresh reviewers re-report waived findings every iteration (the underlying spec text is unchanged), the human re-decides the same waiver repeatedly, and fix+override cycles can exhaust the iteration cap while citing explicitly-waived findings as unresolved. Write no-re-ask rules to cover re-run iterations, not only session resumes. (Verified in unbound-force branch opsx/spec-review-per-finding-gate, 2026-10-22: spec-review F1 override carried forward into code-review C1/C4.)
