---
tag: progress-state
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:11:15Z
identity: progress-state-20261020T001115-jay-flowers
tier: draft
---

Branch-scoped progress state is keyed by the git branch at write time, so a checkpoint recorded before a mid-workflow branch switch lands under the pre-switch branch key (e.g. "main"). Any branch-scoped reader running on the post-switch branch cannot see it. When a workflow switches branches mid-flight, re-record the checkpoint under the new key after the switch, or give readers an explicit fallback to the documented origin key — otherwise data recorded at routing time (issue numbers, decisions) is silently stranded.
