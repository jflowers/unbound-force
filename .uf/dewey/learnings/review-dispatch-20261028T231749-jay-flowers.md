---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-28T23:17:49Z
identity: review-dispatch-20261028T231749-jay-flowers
tier: draft
---

When extracting a shared load-or-degrade helper, wire its degradation flag into EVERY caller's operator-visible output, not just the first caller that consumes it. Observed in unbound-force's review-dispatch plugin (derive-per-run-timeout change, 2026-10): resolveTimeoutLimits returns { limits, degraded }; dispatch_review_runs destructures both and surfaces the fallback as a warning ("silent window shrinkage (1200s→600s) cannot go unnoticed"), but redispatch_failed_runs destructured only { limits }, so a review-matrix load failure on the recovery path silently shrank re-run base windows to the schema default — the exact under-provisioning failure mode the change was built to prevent, on the exact path used to rescue panels killed by it. Review checklist: for any helper returning a status/flag alongside its payload, grep every destructuring site and confirm each caller either reports the flag or documents why it cannot degrade. The same pattern bit the sibling restoration code: restorePriorRunFile's contract says "a failed restore is returned for the caller to report," and the new pre-resolution restoration caller simply dropped the failure branch that all three in-loop callers carry.
