---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-23T00:19:26Z
identity: review-dispatch-20261023T001926-jay-flowers
tier: draft
---

In a single opencode session that runs multiple review dispatches (three spec-review rounds plus a code review for the delegation-skill-enforcement change), the dispatch tools' automatic session resolution can surface a STALE correlation: after the code-review dispatch_review_runs call, both dispatch_status and the first consolidate_dispatch retrieval resolved under the round-1 spec-review correlation_id (433b1c89) rather than the new dispatch. No data was lost — finalization with provenance minted a fresh correlation and artifact (e3445710), and the round-1 artifact file on disk was untouched — but retrieval calls (consolidate without provenance, dispatch_status) can read the wrong dispatch session's runs when several have executed in one parent session. Mitigations: when running more than one dispatch per session, pass correlation_id explicitly to dispatch_status/consolidate_dispatch/redispatch_failed_runs whenever the ID is known; if an auto-resolved ID looks like an earlier dispatch's artifact, verify the run list against expectations before acting; and know that finalize with provenance always mints a fresh artifact, so persisted verdicts never collide.
