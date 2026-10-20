---
tag: unleash-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:11:09Z
identity: unleash-pipeline-20261020T001109-jay-flowers
tier: draft
---

Checkpoint state written before a branch switch stays keyed to the pre-switch branch. uf_unleash_route_decision auto-checkpoints tier-routing while the repo is still on the pre-routing branch (typically main). For the quick tier the tool itself creates and switches to quick/<name>, so the checkpoint lands under the new branch key — but for speckit/openspec the feature branch is created afterward by the delegated entry command, leaving the route decision (including issue_number) under the old key where a branch-scoped reader like /uf.finale never finds it (finale fails closed, so the linkage is silently dropped). Rule: when checkpoint state must survive a branch handoff, write it after the switch, key it explicitly for the target branch, or propagate it during the switch — and test the handoff end-to-end rather than seeding state at the reader.
