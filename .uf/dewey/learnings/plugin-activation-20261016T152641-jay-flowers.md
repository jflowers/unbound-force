---
tag: plugin-activation
author: jay-flowers
category: gotcha
created_at: 2026-10-16T15:26:41Z
identity: plugin-activation-20261016T152641-jay-flowers
tier: draft
---

Adding a new module under .opencode/lib/ that is imported by the activation-gated plugins (invoke-agent, review-dispatch, uf-workflow, uf-finale) requires updating THREE Go registrations in internal/scaffold, not just the embedded-asset inventory: (1) stageReviewPluginSources's asset list in plugin_activation.go — the activation probe imports the staged plugin copies via file:// URLs and ESM resolves their '../../lib/*.js' imports strictly inside the temp stage root, so any unlisted lib dependency breaks (or silently vacates) the probe; (2) isToolOwned in scaffold.go — unregistered lib modules are created once but never overwritten on re-init, while the plugin index.ts sources ARE refreshed by activation's content comparison, producing version-skew import failures at opencode startup after a future lib change; (3) isDivisorAsset in scaffold.go — unregistered lib modules are excluded from DivisorOnly deployments that include the plugins importing them. scaffold_test.go's expectedAssetPaths drift tests verify byte-identity of embedded assets but NOT predicate registration, and TestRunInit_FreshDir's [N, N+4] file-count range plus design D12's 'partial run exits 0' mask activation failures entirely — make check passing proves neither probe success nor registration completeness. When touching plugin imports, add a closure test that extracts '../../lib/*.js' specifiers from the four staged plugin sources and asserts each maps to a staged asset. Discovered during the unleash-deterministic-tools round-2 review council (2026-10-16, run 0c6563e4, artifact 8601976b).
