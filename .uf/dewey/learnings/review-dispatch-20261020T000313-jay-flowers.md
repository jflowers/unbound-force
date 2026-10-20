---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:03:13Z
identity: review-dispatch-20261020T000313-jay-flowers
tier: draft
---

When a tool re-validates its input schema inside execute() as defense-in-depth (e.g., against framework argument-stripping), derive rejection tests from the schema's own enforcement rules — uniqueness constraints, cardinality caps, format validators — not just from execute-body return paths. In review-dispatch's read_assessment_fields tool, the in-execute safeParse existed to enforce uniqueArray, MAX_ASSESSMENT_RUN_IDS=64, and UUIDSchema rules, but only the min(1) empty-array rejection was pinned; a silently weakened schema would have regressed undetected. Extends review-dispatch-20261019T182357 (derive the matrix from the full branch surface) to the schema-validation surface.
