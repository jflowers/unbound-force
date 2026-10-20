---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-20T12:50:32Z
identity: openspec-20261020T125032-jay-flowers
tier: draft
---

Cross-change constraint claims are contracts: when a change's artifacts state that a constraint (e.g., archive order between sibling changes) "is recorded in both changes", verify the claim against both files in the same diff before accepting it. Write cross-change constraints into the dependent change's own artifacts in the same edit that creates the dependency — otherwise the constraint is invisible to anyone working the dependent change, and an archiver can sync spec-delta references to nonexistent tools into the main specs.
