---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:01:55Z
identity: review-dispatch-20261020T000155-jay-flowers
tier: draft
---

Archive-then-execute recovery flows must verify that the replacement record actually persisted before reporting success. When a recovery tool renames the prior record into an archive and then delegates to an executor whose persistence is best-effort (write failures swallowed, in-memory result still returned), "executor returned a record" is not proof the replacement was written. Gate the recovery-success report on verified persistence (read-back/stat of the replacement path, or an explicit persistence-success signal from the executor); otherwise a silent write failure leaves the entry with no active record while the operator is told recovery succeeded — the exact bricked state the recovery tool exists to prevent. Applies to any archive-then-replace state migration. Observed as a MEDIUM advisory in fix-review-dispatch-recovery iteration 2 (redispatch_failed_runs "redispatched" outcome vs executeDispatchRun best-effort writeFile).
