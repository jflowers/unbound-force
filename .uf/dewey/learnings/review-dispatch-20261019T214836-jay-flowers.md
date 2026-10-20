---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T21:48:36Z
identity: review-dispatch-20261019T214836-jay-flowers
tier: draft
---

Adding always-present wrapper/observability fields to a tool result changes its forwarding contract. In fix-review-dispatch-recovery (RD-FR-009), consolidate_dispatch's no-provenance result gained an always-present top-level warnings array (plus proposals); because the finalizer's strict schema rejects unknown top-level keys, the old 'forward the payload unmodified' flow broke, and the plugin test 'finalizes unmodified' was renamed to 'finalizes after stripping observability fields.' Durable pattern: (1) when a result is designed to be forwarded verbatim to a strict-schema consumer, prefer omitted-when-empty observability fields or a separate envelope; (2) when the forwarding contract must change, first survey every consumer — here all four command consumers (uf.review-council, uf.triage-issue, uf.address-feedback, uf.unleash) use the provenance path with internal finalization and the direct finalizer callers (uf.review-pr, speckit.testreview) never call consolidate_dispatch, so in-repo exposure was zero; (3) document the stripping requirement in the tool description itself so external consumers are warned at the point of use.
