---
tag: review-dispatch
author: jay-flowers
category: reference
created_at: 2026-10-20T12:47:57Z
identity: review-dispatch-20261020T124757-jay-flowers
tier: draft
---

When a shared execution core is extracted so a new caller can reuse an established path, audit every swallowed-error site's justification against EACH new caller's authority model, not just the original one. In review-dispatch, executeDispatchRun's best-effort run-file persistence ("Persistence is best-effort; the result is authoritative") was correct for dispatch_agent_run — the in-memory result returned to the caller is authoritative — but redispatch_failed_runs' downstream consumer is the run file itself (consolidate_dispatch reads only disk), so a swallowed write failure after the archive rename leaves the plan entry with no active run file while the recovery summary reports "redispatched" with a new run id. An outcome contract like "runData is null ⇔ no run file was written" conflates record-in-memory with record-on-disk; when any consumer's success semantics depend on durable state, the core must expose persistence success (or the consumer must verify it) and the consumer must treat a failed persist like its other no-replacement exits. Rule: shared-core extraction multiplies callers; re-validate each silent-catch comment against every caller's source of truth.
