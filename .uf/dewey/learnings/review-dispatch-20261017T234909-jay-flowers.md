---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-17T23:49:09Z
identity: review-dispatch-20261017T234909-jay-flowers
tier: draft
---

Divisor review-dispatch fix loops share one dispatch session per opencode session, and consolidate_dispatch validates runs against session-metadata.json that is persisted only on the FIRST dispatch call — so a fix-loop re-dispatch (different plan: changed models, agents moved from skip to include) lands its runs in the same session directory but validates them against the STALE first-dispatch plan, failing with "model provenance does not match its plan entry" / "has no included plan entry" and verdict INCONCLUSIVE. Observed in opsx/command-prose-pilot (2026-10-17): spec review (first dispatch, correlation ef4727de) persisted mode=specs metadata; the code-review iteration-0 re-dispatch coincidentally matched the stale plan and consolidated fine; iteration-1 (adversary moved vertex→enmaas, sre+testing included) failed validation. Recovery that works: consolidate_dispatch re-reads session-metadata.json from disk on every call, so rewrite the file (in the dispatch session dir under the OS temp dir, named session-metadata.json) to the ACTUAL current dispatch state (command, mode, full, input_context, change_profile, plan with exact models/decisions matching the run files, coverage) and re-run consolidate_dispatch with provenance — the plugin then computes the verdict from the untouched run files and finalizes with a fresh artifact correlation. Run files themselves are named run-divisor-<agent>.json in the same directory and hold each run's full data (run_id, model, verdict, findings). Root cause is FR-007 design (session_metadata honored only on first dispatchAgentRun call) interacting with fix loops; a durable fix would persist metadata on every dispatch or key sessions per dispatch.
