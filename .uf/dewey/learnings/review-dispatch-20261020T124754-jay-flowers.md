---
tag: review-dispatch
author: jay-flowers
category: reference
created_at: 2026-10-20T12:47:54Z
identity: review-dispatch-20261020T124754-jay-flowers
tier: draft
---

When reviewing recovery tools that archive-then-replace persisted state files, verify the full persistence chain: (1) the archive rename succeeded (checked), (2) the replacement was written (NOT checked when the executor's persistence is best-effort), and (3) the replacement is readable (NOT checked). In fix-review-dispatch-recovery, `redispatch_failed_runs` correctly restores the prior file on pre-execution early exits (runData null) and executor throws, but trusts `runData !== null` as proof of persistence when the executor's writeFile is wrapped in a swallowed catch. The gap is narrow (OS temp dir, same-process write, no concurrent writers) but violates the archive-then-execute contract: the prior file is invisible to the glob, so a silent write failure leaves the plan entry with no active run file while the operator sees "redispatched".
