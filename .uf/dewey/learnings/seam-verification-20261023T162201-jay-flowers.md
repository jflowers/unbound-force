---
tag: seam-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-23T16:22:01Z
identity: seam-verification-20261023T162201-jay-flowers
tier: draft
---

Adding a plugin tool that a command file invokes with a documented output shape requires extending the golden-output-shape suite with a new site test in the same increment — refreshing the line anchors of existing sites is not enough. The suite's census lines ("uf-finale: 8 sites", "43 of the 47 documented sites") are manually maintained and drift silently when a new documented tool-call site ships without a golden test; factory-level unit tests pin the shape but skip the registry-path execution (loadRegistry + mockGit) that the golden layer verifies per determinism-pack DE-007 Layer 2. Verified on rebase-upstream-before-push (unbound-force/unbound-force, 2026-10-23): uf_finale_base_state was documented at uf.finale.md:132, unit-tested in uf-finale.test.ts, but the golden suite still covers 8 finale sites and its modified header kept the stale count. Recipe: when a diff adds a tool call of the form `tool_name -> {fields}` to a command file, grep the golden suite for the registry's site count and add the new site test alongside the anchor refresh.
