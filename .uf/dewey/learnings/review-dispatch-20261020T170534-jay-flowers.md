---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T17:05:34Z
identity: review-dispatch-20261020T170534-jay-flowers
tier: draft
---

Recovery tools that perform archive-then-execute-then-restore flows (redispatch_failed_runs) implement a three-gate persistence verification pattern that is a strong resilience model: (1) runData null gate catches pre-execution exits, (2) persisted flag gate catches silent write failures, (3) catch-all gate catches unexpected throws. Each gate attempts to restore the archived prior file before reporting, and each reports a distinct outcome (early_exit vs error) with the restoration status in the reason string. The pattern ensures the session never silently regresses from recoverable to unrecoverable. The key insight: the persistence flag (outcome.persisted) was added specifically because the shared dispatch core's write failure is best-effort (swallowed catch), so the in-memory runData is not proof of on-disk state — a distinction that matters only for the recovery caller, not for the original dispatch_agent_run caller where the in-memory result is authoritative.
