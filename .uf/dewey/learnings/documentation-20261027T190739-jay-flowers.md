---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-27T19:07:39Z
identity: documentation-20261027T190739-jay-flowers
tier: draft
---

When review-council runs in uncommitted-local diff mode, the captured diff shows only uncommitted lines — documentation entries committed in an earlier HEAD commit (e.g., a full CHANGELOG Unreleased entry) appear truncated to just the uncommitted delta. A reviewer verifying documentation completeness from the diff alone would wrongly conclude the entry is missing. When the review context flags that content was committed in HEAD, read the working-tree file (Read tool) before reporting a documentation gap. Observed on replicator-version-floor round 2 (2026-10-27): the CHANGELOG diff showed only the +1 `(Docs: #844, unbound-force/website#337)` traceability line while the full entry lived in HEAD 4b3d0fe0; reading the working tree confirmed the complete entry with the spec-required upgrade path.
