---
tag: spec-conventions
author: jay-flowers
category: gotcha
created_at: 2026-10-29T15:56:26Z
identity: spec-conventions-20261029T155626-jay-flowers
tier: draft
---

When a spec's MUST clauses scope a behavior to a subset of operation kinds (e.g., "Recovery operations ... MUST record those warnings"), a shared-type doc comment written at the general level ("Settled records carry what was known at settle time") creates a silent asymmetry: non-mandated paths (dispatch) omit the field while mandated paths (recovery) populate it. When writing or reviewing such specs, either scope the shared field's doc comment to match the MUST's scope or flag the asymmetry so the doc comment and all call sites stay reconciled. Seen in derive-per-run-timeout: RD-FR-031 scopes warning recording to recoveries, but OperationRecord.warnings' doc comment reads generally, and the dispatch settle call (index.ts:5006) omits warnings while recovery settles (6322/6331/6631) populate it.
