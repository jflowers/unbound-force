---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-15T16:47:25Z
identity: openspec-20261015T164725-jay-flowers
tier: draft
---

Stacked OpenSpec changes that MODIFIED/REQUIRE requirements living only in an unarchived predecessor change cannot pass `openspec validate` until the predecessor archives, because delta validation resolves against `openspec/specs/` (the main specs), not against pending change directories. When stacking increments this way (e.g., unleash-deterministic-tools over unarchived unleash-direct-review-dispatch), record the deferred validation as an explicit task — run `openspec validate` after the predecessor archives and re-check that the predecessor's archived requirement text still matches the MODIFIED/REMOVED anchors — rather than leaving the sequencing constraint as proposal prose, which nothing enforces.
