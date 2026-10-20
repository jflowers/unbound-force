---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T22:31:29Z
identity: review-dispatch-20261019T223129-jay-flowers
tier: draft
---

Archive-then-execute recovery tools must define a restore path for pre-execution failures. When a recovery tool moves the prior record aside (archive) before attempting its replacement, any failure that exits before the replacement is written strands the target: the archived record is invisible to every tool (outside the active-file glob), the recovery tools can no longer see it (re-invocation reports not_found), and downstream validation fails closed on the missing record — regressing a recoverable session into an unrecoverable one in exactly the degraded conditions (model unavailability, policy load failure, cancellation) the recovery tool exists for. The pattern: restore the archived record when the attempt exits pre-execution (rename back when no replacement file was written), report the restore in the outcome, and test that the session remains consolidatable after the early exit. Observed in redispatch_failed_runs (fix-review-dispatch-recovery, issue #751 iteration 1): pre-execution early exits (runData null — policy_load_failed, unknown_agent, tier/host model unavailability, cancelled) and unexpected throws leave the plan entry with no active run file, and the finalizer rejects consolidation with 'included plan entry ... has no run' (validatePlanAndRuns).
