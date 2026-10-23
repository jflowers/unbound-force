---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-23T14:56:36Z
identity: review-dispatch-20261023T145636-jay-flowers
tier: draft
---

Per-invocation identity minting for conversation-scoped tool state (verified in fix-review-dispatch-correlation-release, issue #794, .opencode/plugins/review-dispatch/index.ts): mint the operation's correlation ID immediately after input validation and re-point the session-to-identity map BEFORE any session-creating side effect (sibling evidence, prompt building, run dispatch). This yields three properties: (1) each workflow from one conversation gets its own on-disk session directory, so a second workflow cannot clobber the first — prior sessions survive as audit trail and remain retrievable by explicit correlation ID on the read-side tools; (2) session-less outcomes (all-skip plans, pre-dispatch prompt failure) still re-point the map, so later no-provenance retrieval fails closed as not_found instead of silently returning the previous workflow's payload — this converts a latent cross-workflow data-integrity bug into a correct fail-closed; (3) join semantics for single-run calls stay intact when the join path only mints on map miss (mint-or-reuse), preserving multi-call fan-out as one session. Report the minted identity in the operation's machine-readable output (schema field plus prose summary with a 'none' fallback for pre-validation failures) so every session is explicitly addressable. Verified 2026-10-23: all post-validation return sites (all-skip, prompt-building failure, terminal — budget exhaustion folds into the terminal return via the budgetExceeded flag) carry correlation_id; direct dispatchAgentRun keeps mint-or-reuse/join-latest (RD-CR-003).
