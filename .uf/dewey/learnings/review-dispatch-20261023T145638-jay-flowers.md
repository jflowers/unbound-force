---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-23T14:56:38Z
identity: review-dispatch-20261023T145638-jay-flowers
tier: draft
---

Latest-dispatch correlation pattern (fix-review-dispatch-correlation-release, issue #794): when a module-level map binds a parent session to a shared resource, per-invocation re-pointing restores multi-workflow-per-conversation correctness. Three properties make it work in the review-dispatch plugin: (1) mint the fresh correlation immediately after input validation, before any side-producing step, so session-less outcomes (all-skip, prompt failure) leave the map pointing at a correlation with no session directory — no-provenance retrieval then fails closed as not_found instead of returning a previous workflow's payload; (2) report the minted correlation_id on every post-validation return path so older sessions stay addressable through the read-side explicit correlation_id; (3) read the invocation-local minted ID for post-dispatch collection, never a map re-read. Residual hardening (noted as advisory at Approve 2026-10-23): internal dispatchAgentRun calls still resolve via the map, so concurrent aggregate invocations from one parent session could interleave re-pointing; threading the invocation's correlation to internal calls as an internal function parameter (distinct from the deferred tool-input correlation control, design D6) closes the gap.
