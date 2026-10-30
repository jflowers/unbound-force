---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-29T15:56:33Z
identity: test-quality-20261029T155633-jay-flowers
tier: draft
---

A load-or-degrade helper's fallback VALUE cannot be pinned end-to-end when the same corruption that triggers the degrade also kills the downstream consumer. In review-dispatch, corrupting the review matrix makes loadPolicies throw for both limits resolution and per-run loads, so degraded runs exit before persisting a derived window — tests can assert the degradation warning but never observe the 600s fallback base_ms. Signal-only degradation tests leave catch-branch regressions (wrong limits returned) invisible. Pin the catch branch directly: export the helper for unit testing, or inject a stateful loadPolicies double that throws only on the first call so the degraded path is exercised while the consumer still succeeds.
