---
tag: review-dispatch
author: jay-flowers
category: context
created_at: 2026-10-23T12:42:06Z
identity: review-dispatch-20261023T124206-jay-flowers
tier: draft
---

Task 2.3 of fix-review-dispatch-correlation-release (issue #794, design D2) confirmed 2026-10-23: direct dispatch_agent_run calls kept conversation-binding semantics after the D1/D3 changes to dispatchReviewRuns in .opencode/plugins/review-dispatch/index.ts. Verified invariants: (1) mint — when sessionCorrelationMap has no entry for the parent session, dispatchAgentRun's isFirstCall branch (lines ~3281-3286) mints a randomUUID and sets the map; (2) reuse — map hit leaves the mint branch dormant, so direct multi-call fan-out from one parent session shares one dispatch session; (3) join-latest — because dispatchReviewRuns re-points the map to its freshly minted correlation before dispatching (D1), a direct call after an aggregate dispatch reuses that entry and joins the LATEST aggregate session. isFirstCall is used nowhere else in the file. Evidence: git diff showed no hunks touching dispatchAgentRun or createDispatchAgentRunTool; the existing dispatch-agent-run.test.ts suite (41 tests, incl. "reuses the same correlation_id for multiple calls in the same session") passed; an ephemeral scratch vitest exercising the real plugin server hooks confirmed mint/reuse and join-latest across two aggregate dispatches (C1 then C2, direct calls joined C1 then C2 respectively) and was deleted afterward. No code change was needed or made. Guard for future work: changing dispatchAgentRun to per-invocation minting would shatter direct multi-call fan-out into N single-run sessions that consolidate_dispatch cannot validate as one plan (design D2 rejection rationale).
