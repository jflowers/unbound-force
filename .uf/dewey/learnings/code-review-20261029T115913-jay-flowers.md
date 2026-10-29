---
tag: code-review
author: jay-flowers
category: pattern
created_at: 2026-10-29T11:59:13Z
identity: code-review-20261029T115913-jay-flowers
tier: draft
---

Retrospective learnings captured mid-change describe intermediate code states, not necessarily the shipped state. Review technique: when a diff carries both implementation and retrospective learnings from the same workflow, read each learning that names a concrete defect as a candidate finding and verify it against the final diff. On opsx/derive-per-run-timeout (2026-10-29) this surfaced two shipped defects — redispatch_failed_runs discarding resolveTimeoutLimits' degraded flag and dropping restorePriorRunFile's failed-restore branch — that the change's own learnings described in present tense. Learnings authored during a fix-loop describe the state at capture time; only the diff is the merged state.
