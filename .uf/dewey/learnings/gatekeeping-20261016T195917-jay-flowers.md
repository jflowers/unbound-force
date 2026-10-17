---
tag: gatekeeping
author: jay-flowers
category: pattern
created_at: 2026-10-16T19:59:17Z
identity: gatekeeping-20261016T195917-jay-flowers
tier: draft
---

When a maintainer authorizes a gate-value change in-session mid-workflow (e.g., raising .uf/review-matrix.yaml per_run_timeout_seconds so a review council can complete on a large diff), the artifact trail — design decision citing approver/date/rationale, proposal Impact entry covering the canonical file plus its scaffold mirror, CHANGELOG note — satisfies the traceable-authorization requirement but remains agent-authored and is written after the change is applied. The durable closure is an explicit maintainer ratification comment on the implementing PR before merge: it converts a self-reported account of an in-session approval into independent, on-record pre-merge sign-off. Observed on unbound-force PR #745 (per_run_timeout_seconds 600→1200, design decision D11): the council's HIGH finding was resolved by the artifact record, and the residual reviewer ask was exactly this on-PR ratification. Complements learning/review-dispatch-20261016T135620-jay-flowers, which defines the artifact-traceability standard but not the PR-ratification step.
