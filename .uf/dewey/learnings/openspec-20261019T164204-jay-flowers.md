---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-19T16:42:04Z
identity: openspec-20261019T164204-jay-flowers
tier: draft
---

OpenSpec requirement-ID allocation (e.g. RD-FR-009) requires surveying ALL sibling active (unarchived) changes under openspec/changes/ before assigning IDs — not just the main spec under openspec/specs/. In unbound-force/unbound-force, the review-dispatch capability has NO main spec yet: RD-FR-001..008 are defined only in the unarchived review-council-multi-model-fanout change, and optional-profile-models/specs/review-matrix.md (lines 3-6) explicitly reserves RD-FR-009..018 for future review-matrix deltas. The fix-review-dispatch-recovery change assigned RD-FR-009..011 without checking that reservation, creating a duplicate-ID collision that would surface only at archive time when both deltas merge into the main spec. Before assigning requirement IDs in a delta: (1) read openspec/specs/<capability>/spec.md if it exists; (2) search all active changes under openspec/changes/ (excluding archive/) for the capability name and ID range; (3) honor explicit ID reservations made in sibling changes; (4) if base IDs live in an unarchived change, reference them without renumbering or coordinate renumbering before either change archives.
