---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-16T16:28:08Z
identity: review-dispatch-20261016T162808-jay-flowers
tier: draft
---

Round-N fix-loop walkthroughs can claim file changes that the dispatch diff and changed-files manifest do not contain. In the unleash-deterministic-tools round-3 council, internal/scaffold/scaffold.go carried the predicate-registration fix in the working tree, but was absent from both the slim diff and the full-diff file arithmetic (30 primary + 30 learnings + 8 mirrors = 68 left no room for it). Verify walkthrough fix claims against the actual tree (read/grep the named files) whenever a claimed-changed file is missing from the manifest, and flag the manifest gap explicitly: explicit staging from a stale manifest omits required files from the feature commit, and the council otherwise approves changes it never saw in its diff input.
