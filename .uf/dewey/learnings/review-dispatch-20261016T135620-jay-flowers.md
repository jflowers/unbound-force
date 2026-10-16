---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-16T13:56:20Z
identity: review-dispatch-20261016T135620-jay-flowers
tier: draft
---

Modifying a gatekeeping value in .uf/review-matrix.yaml (e.g., per_run_timeout_seconds) requires traceable authorization inside the spec artifacts — a design decision citing approver/date/rationale plus an Impact entry for both the canonical file and its scaffold mirror. A CHANGELOG "maintainer-approved" claim authored in the same diff is not traceable authorization and will be flagged by gatekeeping review. When an operational accommodation is needed mid-change (e.g., reviewer runs timing out at the default), either document the approval in the active change's artifacts or split the gate hunk into a separately authorized chore change; the scaffold mirror must move in the same commit as the canonical file to keep the byte-identical drift test green.
