---
tag: review-process
author: jay-flowers
category: pattern
created_at: 2026-10-27T18:28:41Z
identity: review-process-20261027T182841-jay-flowers
tier: draft
---

In uncommitted-local review mode, artifacts committed on the feature branch (e.g., a spec-required CHANGELOG.md entry) do not appear in the diff. Before flagging a missing documentation artifact — or accepting a review-context assertion that it exists — read the working-tree file: the working tree contains HEAD plus uncommitted changes, so a direct read verifies committed content the diff cannot show. Applied in the replicator-version-floor review (2026-10-27): the CHANGELOG entry was committed in HEAD 4b3d0fe0, absent from the uncommitted-local diff, and confirmed present by reading CHANGELOG.md lines 9-32, avoiding a false missing-entry finding.
