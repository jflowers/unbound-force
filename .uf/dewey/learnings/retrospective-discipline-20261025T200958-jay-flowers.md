---
tag: retrospective-discipline
author: jay-flowers
category: gotcha
created_at: 2026-10-25T20:09:58Z
identity: retrospective-discipline-20261025T200958-jay-flowers
tier: draft
---

When a change's retrospective captures a learning that prescribes a concrete fix for code in the same change, apply the fix before merging rather than shipping the learning and the violating code together. On opsx/fix-init-speckit-sentinel, three learnings produced during the change each documented a gap still present in the change's own diff: assertion-depth prescribed prefix matching for negative not-invoked guards while TestInitSubTools_SpecifySkipped kept the exact-string comparison that had already required re-syncing twice; scaffold-testing warned that guard-test comments must not claim exact fidelity to Run()'s filtered write set while TestSimpleToolsSentinelsNotScaffolded claimed 'enumerates exactly the paths Run() can scaffold'; test-coverage identified the unpinned FR-019 scenario-2 (sentinel exists + binary missing) that tasks.md never scheduled. A learning captured alongside un-remediated code is a self-inconsistency reviewers must flag — either backfill the one-line fixes into the change or record in the change why each remediation is deferred.
