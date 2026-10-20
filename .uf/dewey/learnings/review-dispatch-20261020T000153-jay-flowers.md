---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:01:53Z
identity: review-dispatch-20261020T000153-jay-flowers
tier: draft
---

In review-dispatch's executeDispatchRun, cancellation has two distinct paths: pre-execution (abort during advisor host-model resolution early-exits with error code "cancelled" and runData null — no run file written; abort check sits inside the host-model catch block) vs post-executor (executeAgentSession returns status "cancelled", which IS persisted as a run file and is excluded from consolidation payloads per RD-FR-009). Consumers must distinguish the paths via runData === null, never via the "cancelled" code alone. Reviewer gotcha that nearly produced a false doc-accuracy finding: the executeDispatchRun JSDoc's runData-null enumeration exactly matches the function's five earlyExit call sites. Audit doc-comment enumerations against the containing function's actual early-exit call sites — including abort checks hidden inside catch blocks — before flagging them as inaccurate.
