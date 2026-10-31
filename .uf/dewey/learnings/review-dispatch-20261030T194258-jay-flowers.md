---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-30T19:42:58Z
identity: review-dispatch-20261030T194258-jay-flowers
tier: draft
---

When extending the per-run timeout derivation (RD-FR-028/029, .opencode/lib/run-timeout.ts) with a new mode-dependent input (e.g., review-dispatch-diff-manifest's manifestMode retrieval allowance, RD-FR-036), the signal must also be persisted among the run's work signals for the redispatch recovery path: redispatch_failed_runs re-derives timeouts from persisted prompt bytes and plan-entry tier without re-running prompt assembly (.opencode/plugins/review-dispatch/index.ts:6508-6519), so a mode signal wired only through the fresh-dispatch flow is silently lost on re-runs and the re-dispatched run is under-timed — the exact failure the allowance exists to prevent. Any future derivation input with mode-dependent semantics needs both the dispatch-path wiring and a persisted-signal (or re-derivation) story plus a recovery-path test.
