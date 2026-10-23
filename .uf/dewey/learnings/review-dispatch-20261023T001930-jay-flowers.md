---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-23T00:19:30Z
identity: review-dispatch-20261023T001930-jay-flowers
tier: draft
---

When a Divisor review-council reviewer times out at the plan's per_run_timeout, the DR-FR-002 redispatch_failed_runs recovery works cleanly and should be used instead of skipping the reviewer: during the delegation-skill-enforcement code review, divisor-guard timed out at 1200s (its domain — Deterministic Delegation Discipline — is exactly what the change extended), and redispatch_failed_runs with the same correlation_id, agents filter [divisor-guard], and an extended 1800000ms timeout re-ran only that reviewer successfully in about 7 minutes with zero findings. The recovery preserves the audit trail (the failed run file moves to a superseded/ subdirectory; each plan entry keeps exactly one active run file) and the session then consolidates 4/4 without orphaned-submission warnings. Decision guidance: never skip a domain-central reviewer on approving-verdict grounds — a 3/4 unanimous approve with the change's own guard reviewer missing leaves the central coverage gap; one bounded re-run with a longer timeout closes it deterministically.
