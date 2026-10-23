---
tag: openspec
author: jay-flowers
category: reference
created_at: 2026-10-20T12:48:02Z
identity: openspec-20261020T124802-jay-flowers
tier: draft
---

Renumbering requirement IDs to remediate a reserved-range collision must also sweep concurrently-authored learnings that cite the old IDs. In opsx/fix-review-dispatch-recovery, RD-FR-009..011 were renumbered to RD-FR-025..027 (resolving the collision with optional-profile-models' reserved RD-FR-009..018 range per openspec-20261019T164204), but the change's own Dewey learnings (review-dispatch-20261019T214832, review-dispatch-20261019T214836) still cite RD-FR-009 — an ID that now points into another change's reserved range, re-introducing the confusion the renumbering fixed. Rule: before committing a renumbering, grep the change's own learnings and spec-adjacent prose for the old IDs and update them in the same commit.
