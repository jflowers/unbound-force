---
tag: gatekeeping
author: jay-flowers
category: gotcha
created_at: 2026-10-16T19:59:13Z
identity: gatekeeping-20261016T195913-jay-flowers
tier: draft
---

Gate modifications (review limits, coverage thresholds, CI flags) authorized by the maintainer in-session during pipeline execution satisfy the AGENTS.md gatekeeping traceability requirement once recorded in the change artifacts — design decision with approver/date/rationale/rollback/scope, proposal Impact entries for the canonical file and its scaffold mirror, CHANGELOG note, and task record (complementing learning/review-dispatch-20261016T135620-jay-flowers, which covers the artifact-level requirement). The residual procedural gap: the implementing PR itself carries no pre-merge sign-off, because the authorization predates the PR and lives only in the change artifacts and the in-session transcript. Correct handling when a reviewer requests ratification (observed on PR #745, per_run_timeout_seconds 600→1200, D11): assess the item as valid and DATA-DRIVEN, recommend ACCEPT, and recommend that the maintainer post a single explicit ratification comment on the PR referencing the recorded decision's approver, date, rationale, rollback, and scope before merge. The agent must not perform the GitHub mutation and must not reply in the maintainer's stead. The proportionate resolution is the ratification comment — not reverting and re-applying the gate change, and not splitting the hunk into a separate chore change (that alternative applies when no in-artifact authorization record exists).
