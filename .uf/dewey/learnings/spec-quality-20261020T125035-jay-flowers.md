---
tag: spec-quality
author: jay-flowers
category: pattern
created_at: 2026-10-20T12:50:35Z
identity: spec-quality-20261020T125035-jay-flowers
tier: draft
---

When a review fix extracts one mechanical procedure from prose into a tested tool, sweep the sibling procedures in the same requirement before approving. Partial extraction satisfies the finding's letter while leaving the requirement class unenforced. In the unleash-tier-routing change, the round-1 fix extracted route decisions and risk floors into uf_unleash_route_decision with table-driven tests, but the adjacent issue-reference-resolution procedure (gh issue view choreography with fail-closed handling) remained prose in uf.unleash.md Step 1a.1 and the tier-routing SKILL.md, leaving its MUST scenarios unverifiable in CI.
