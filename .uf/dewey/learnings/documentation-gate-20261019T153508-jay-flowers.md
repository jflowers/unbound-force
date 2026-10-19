---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-19T15:35:08Z
identity: documentation-gate-20261019T153508-jay-flowers
tier: draft
---

Surface-list sweeps miss same-file procedural drift. When a change adds or updates a syntax/grammar teaching bullet in a command, template, or doc file, grep the entire file for the old syntax forms — procedural steps elsewhere in the same file (e.g., extraction instructions scoped to the old form) go stale silently. Corollary: when a task expands a change's file surface beyond the original proposal, re-sweep the proposal's Impact Files list so the archived record matches the executed scope. Observed in opsx/clarification-marker-superset: speckit.specify.md line 207 was left colon-scoped ('Extract all [NEEDS CLARIFICATION: ...] markers') while line 135 taught the three-form superset, and the proposal Files list omitted two doc surfaces task 5.2 actually touched.
