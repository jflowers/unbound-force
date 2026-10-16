---
tag: uf-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-16T16:28:14Z
identity: uf-workflow-20261016T162814-jay-flowers
tier: draft
---

Cross-plugin artifact contracts (writer in one plugin, reader in another) need a connecting test that runs the real producer's serializer output through the real consumer's parser — hand-built fixtures on each side validate the halves in isolation but cannot catch drift in the duplicated field-path knowledge between them. Pattern established by the #707 fix (write_unleash_summary → readUnleashSummary connecting test in uf-finale.test.ts, unleash-deterministic-tools iteration 3, 2026-10-16). The review-dispatch artifact contract (envelopeFor → parseReviewDispatchArtifact) is the remaining uncovered instance; its fail-open direction (parse failure re-runs the review council) makes drift costly-but-silent, which is exactly the profile that survives undetected without a connecting test.
