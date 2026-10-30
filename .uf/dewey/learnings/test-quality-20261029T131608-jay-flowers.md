---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-29T13:16:08Z
identity: test-quality-20261029T131608-jay-flowers
tier: draft
---

When testing a fallback-to-defaults branch, first make the configured source value differ from the fallback default, then break the source so the load fails, then assert BOTH the applied value and the operator-visible signal. Concretely (review-dispatch timeout derivation, derive-per-run-timeout PR #860): set the scratch matrix per_run_timeout_seconds to 1200, corrupt the matrix so loadPolicies throws, invoke dispatch_review_runs without per_run_timeout_ms, then assert the persisted run's timeout provenance base_ms is 600_000 (the fallback, not the fixture's 1200_000) AND the invocation's warnings carry the degradation message. Value-only assertions pass under a dropped-warning regression; signal-only assertions pass under a wrong-limits regression; together they pin the contract. Trap to watch: if the fixture value equals the fallback default (600 == 600), a degraded run is indistinguishable from a successful load via the value alone — the discriminating non-default setup is the load-bearing step. Also corrupt the file's content rather than deleting it: a missing config may parse as absent-and-default rather than throwing, which never exercises the catch branch.
