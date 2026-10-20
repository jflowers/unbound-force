---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:03:12Z
identity: review-dispatch-20261020T000312-jay-flowers
tier: draft
---

Newly mandated tool calls inherit failure-mode obligations individually. When a change adds bounded failure/retry semantics for one newly sanctioned tool call, every other call the same change newly sanctions must be audited for its own failure paths: tool error returns, transport failure, and capacity caps. Observed on PR 761 (opsx/fix-triage-issue-dispatch-docs): uf.triage-issue.md §3.1's newly mandated read_assessment_fields call documented only data-unavailability degradation (missing/unparseable child text) while FR-001 gave the consolidate_dispatch retrieval call full transient/permanent/all-skip semantics — omitting validation_error returns and the tool's 64 run_id cap vs the 512-entry plan schema, recreating the improvised-behavior gap the change was fixing. Recipe: for each newly sanctioned call, enumerate (1) call-failure modes, (2) data-unavailability modes, (3) capacity limits, and pair side-effect-free calls with bounded-retry guidance per learning spec-quality-20261019T022503.
