---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-23T12:01:51Z
identity: openspec-20261023T120151-jay-flowers
tier: draft
---

The unbound-force OpenSpec requirement-ID namespace for the review-dispatch family is allocation-managed, not free-form: RD-FR-001..008 live in review-council-multi-model-fanout, RD-FR-009..018 are reserved and RD-FR-019..024 allocated to review-matrix deltas (documented in the numbering note at the top of optional-profile-models/specs/review-matrix.md), RD-FR-025..027 in fix-review-dispatch-recovery, and DR-FR-001..003 in the dispatch-recovery capability delta. A separate legacy unqualified FR-NNN scheme from the dispatch-review-runs change also exists — its FR-007 ("Session metadata passthrough") visually collides with RD-FR-007 (fail-closed no-success). When authoring new spec deltas for this family: continue the allocated RD-FR sequence (next free: RD-FR-028+) or carry an explicit numbering note justifying any new prefix band, and qualify any legacy FR-NNN reference with its change name. These IDs are load-bearing — dispatch tool descriptions and plugin source comments cite them (RD-FR-025/026/027, DR-FR-001), so prefix fragmentation in the archived registry degrades cross-reference reliability.
