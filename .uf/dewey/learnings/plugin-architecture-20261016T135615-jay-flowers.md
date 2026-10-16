---
tag: plugin-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-16T13:56:15Z
identity: plugin-architecture-20261016T135615-jay-flowers
tier: draft
---

When a second plugin consumes another plugin's artifact store, extract the contract into a shared lib/ module and register the consumer in the artifact-type registry. In the unleash-deterministic-tools change (2026-10-16), uf-workflow's detect_resume duplicated review-dispatch's DISPATCH_ARTIFACT_DIRECTORY constant, artifact_type discriminator, and envelope field knowledge to 'avoid plugin-to-plugin coupling' — but .opencode/lib/ exists precisely for cross-plugin contracts (uf-workflow-types.ts is already shared by uf-workflow and uf-finale). Duplicated artifact contracts fail open silently: a producer-side store relocation or envelope change makes the consumer report 'not done' with no error signal, re-running expensive workflows (full review councils) instead of surfacing a mismatch. Pattern: producer and consumer import the path constant, type discriminator, and a typed accessor from one lib module; add the consumer to schemas/README.md's Review Artifact Relationships table; pin the contract with a drift test that fails when either side changes it unilaterally.
