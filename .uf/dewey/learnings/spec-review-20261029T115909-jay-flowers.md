---
tag: spec-review
author: jay-flowers
category: gotcha
created_at: 2026-10-29T11:59:09Z
identity: spec-review-20261029T115909-jay-flowers
tier: draft
---

Learnings shipped inside a change's own diff can name defects that remain in the final state. PR #860 (opsx/derive-per-run-timeout) committed two learnings — review-dispatch-20261028T231749-jay-flowers and review-dispatch-20261028T231758-jay-flowers — documenting the redispatch degraded-flag drop, the pre-resolution restoration failure-branch drop, and the prompt_bytes typeof-only assertion as defects; all three persist in the reviewed diff. A learning records observation-time state, not evidence that a fix later landed. When reviewing a diff that carries .uf/dewey/learnings entries naming defects, grep each named defect against the final code state before treating the learning as purely historical — defect-naming learnings double as a ready-made verification checklist for the reviewer.
