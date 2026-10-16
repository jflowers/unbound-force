---
tag: uf-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-16T15:26:43Z
identity: uf-workflow-20261016T152643-jay-flowers
tier: draft
---

Cross-plugin artifact contracts are best pinned with a connecting test rather than mirrored fixtures: run the real producer tool (e.g. uf-workflow's write_unleash_summary) against mocked node:fs, then serve the exact bytes and path it wrote to the real consumer tool (e.g. uf-finale's uf_finale_pr_context). This exercises actual serialization/deserialization on both sides of the contract (issue #707), so format drift between plugins fails tests instead of surfacing at PR time. Pattern implemented in .opencode/test/uf-finale.test.ts during the unleash-deterministic-tools change (round-2 council, run e5abd9fe, artifact 8601976b).
