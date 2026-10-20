---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-19T23:13:55Z
identity: review-dispatch-20261019T231355-jay-flowers
tier: draft
---

In review-dispatch recovery tests, the early-exit trigger choice is constrained by the finalizer's model-provenance check (validateRunModel: plan.model MUST equal run.requested_model, and explicit-source runs require non-null requested_model). tier_model_unavailable as a redispatch trigger requires a model-less (model: null, tier: "standard") plan entry plus a broken matrix — but the restored prior run fixture carries requested_model "provider/standard", so the finalizer rejects the restored session with "model provenance does not match its plan entry", making a "session stays consolidatable" finalize assertion impossible. unknown_agent (agent absent from the reviewer manifest — manifest drifted between dispatch and recovery) fires at manifest validation, BEFORE model resolution, so the plan entry keeps its model provenance matching the run fixture and the restored session finalizes APPROVE. Rule: when a recovery test must assert finalizer acceptance, pick early-exit triggers that precede model resolution (policy_load_failed, unknown_agent), or keep tier triggers and drop the finalize assertion. Observed in fix-review-dispatch-recovery iteration 2 (restore-on-early-exit fix, issue #751).
