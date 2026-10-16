---
tag: artifact-contracts
author: jay-flowers
category: pattern
created_at: 2026-10-15T23:44:18Z
identity: artifact-contracts-20261015T234418-jay-flowers
tier: draft
---

When implementing the producer half of an artifact contract after the consumer half has already merged, the originating issue's proposed schema may be stale — verify the implemented consumer's actual read path and conform the producer to it, documenting the deviation from the issue proposal in the change's design record. In persist-unleash-summary (branch opsx/persist-unleash-summary), issue #707 proposed an envelope schema with snake_case payload fields, but the already-merged uf_finale_pr_context reads the file wholesale and finale prose accesses `.whatWasBuilt`/`.howToVerify` at the top level; following the issue verbatim would have produced an incompatible producer. Issue text is intent, merged consumer code is contract. The consumer-contract test (asserting the written JSON exposes top-level camelCase fields with no envelope nesting) is the mechanism that pins this — such a schema-shape test should accompany every producer added for an existing consumer.
