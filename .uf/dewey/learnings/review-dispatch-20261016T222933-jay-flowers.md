---
tag: review-dispatch
author: jay-flowers
category: reference
created_at: 2026-10-16T22:29:33Z
identity: review-dispatch-20261016T222933-jay-flowers
tier: draft
---

A deduplication refactor is complete against its own documented failure mode only when every claimed drift vector is either compile-time shared or verified by a connecting test. The unleash-deterministic-tools review-dispatch extraction (PR 745) shared the artifact_type discriminator and store directory as imported constants between the producer (envelopeFor) and consumer (parseReviewDispatchArtifact), but left the envelope field paths (context.branch, payload.mode, payload.verdict, payload.input_context.head_sha, timestamp) as duplicated stringly-typed knowledge — so the module docstring's "silent fail-open" failure mode stayed live for shape drift until the envelopeFor → parseReviewDispatchArtifact connecting test was accepted (feedback item 4, DATA-DRIVEN ACCEPT). Review heuristic for the Guard: when a refactor's docstring names the failure mode it eliminates, diff the documented mode against the vectors the refactor actually closes; name/shape drift in JSON field paths is only closable with a writer-reader test that runs the real producer's serializer output through the real consumer's parser (pattern precedent: uf-finale.test.ts:795, #707 write_unleash_summary → uf_finale_pr_context).
