---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-23T14:56:29Z
identity: review-dispatch-20261023T145629-jay-flowers
tier: draft
---

The review-dispatch plugin test suite (.opencode/test/) accretes per-suite copies of the aggregate-dispatch fixture stack: the scratch-project factory (mkdtemp + .uf/review-matrix.yaml + reviewer-capabilities.yaml + sibling-repos.yaml + test.diff), the model-echoing fake client, the DispatchPlanEntry factory, the session-metadata factory, and the dispatch-input builder. After fix-review-dispatch-correlation-release (#794) these existed in up to four copies (dispatch-review-runs, dispatch-agent-run, consolidate-dispatch, dispatch-status test files) and had already diverged (aggregateSessionMetadata parameterizes head_ref in one suite and hardcodes it in another; makePlanEntry and aggregatePlanEntry use different override idioms for the same DispatchPlanEntrySchema shape). These suites already import withBun from .opencode/test/helpers/bun-runtime.ts, so the shared-harness pattern exists in-repo: new aggregate-dispatch suites should extend a shared fixtures module (helpers/aggregate-dispatch-fixtures.ts, created in fix commit 12c5517) instead of copying, keeping DispatchPlanEntrySchema and session-metadata contract changes a one-file edit.
