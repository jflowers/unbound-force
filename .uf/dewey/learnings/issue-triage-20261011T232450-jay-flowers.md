---
tag: issue-triage
author: jay-flowers
category: pattern
created_at: 2026-10-11T23:24:50Z
identity: issue-triage-20261011T232450-jay-flowers
tier: draft
---

New parallel tools must honor all behavioral contracts from prior specs. When dispatch_review_runs was introduced as a parallel replacement for sequential dispatch_agent_run calls, it must preserve the same model resolution contract (RD-FR-022) including the resolveHostModel() fallback path for advisor runs with null profiles. Behavioral contracts from prior specs are not optional optimizations — they are invariants that must be preserved across refactors.
