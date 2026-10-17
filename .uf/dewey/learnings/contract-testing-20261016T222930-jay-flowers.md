---
tag: contract-testing
author: jay-flowers
category: reference
created_at: 2026-10-16T22:29:30Z
identity: contract-testing-20261016T222930-jay-flowers
tier: draft
---

Extracting a shared contract module (constants + parser) between a producer and a consumer removes constant-level drift — both sides import the same identifiers — but not shape-level drift: the producer still constructs the envelope and the consumer still parses it in independent code paths. Fixture-based tests on either side stay green through a producer-side field rename when the fixtures are updated in the same commit, and a fail-open consumer shows no error, so the break is silent. The remedy is one connecting test per seam: run the real producer write path against injected scratch/mocked filesystem dependencies, read the persisted artifact bytes from disk, feed them to the consumer parser, and assert the decision fields. Precedent: uf-finale.test.ts:795 (#707 writer-reader contract) — "A hand-written fixture could drift from the writer's shape; running the real writer against the same mocked filesystem and branch cannot."
