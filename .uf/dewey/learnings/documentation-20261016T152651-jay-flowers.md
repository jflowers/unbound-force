---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-16T15:26:51Z
identity: documentation-20261016T152651-jay-flowers
tier: draft
---

In the unbound-force meta repo, a change that introduces a new durable on-disk artifact contract (e.g. .uf/artifacts/unleash-summary/<slug>.json: producer write_unleash_summary in uf-workflow, consumer uf_finale_pr_context in uf-finale) needs a deliberate documentation-surface decision at docs-issue filing time. The schemas/ registry (schemas/README.md) documents one artifact type per schema directory and serves cross-hero/cross-repo consumers, so intra-repo plugin-to-plugin contracts belong in the docs issue's architecture.md scope — name the artifact path, producer, consumer, and shape explicitly in the issue's per-page table so later Scribe execution covers the contract, not just the tool inventory. Verified 2026-10-16 on unleash-deterministic-tools: docs/ had zero mentions of unleash-summary while code and connecting tests shipped; issue #739's Why described the artifact but its architecture.md row named only tools and lib modules. (Round-2 council, run 704e510f, artifact 8601976b.)
