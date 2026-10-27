---
tag: opsx-replicator-version-floor
author: jay-flowers
category: gotcha
created_at: 2026-10-27T19:08:56Z
identity: opsx-replicator-version-floor-20261027T190856-jay-flowers
tier: draft
---

Operational gotcha from the opsx/replicator-version-floor pipeline (2026-10-27): the divisor-adversary reviewer (model google-vertex-anthropic/claude-opus-4-6@default) failed with a retryable child_prompt_failed ("Unexpected server error", distinct err refs each time) in ALL THREE dispatch rounds — specs mode, code round 1, and code round 2 — while every standard-tier reviewer (enmaas/rits/zai-org/glm-5-3) succeeded. Consolidation remained valid each time because the council protocol requires at least one successful structured assessment, and 3-4 successes were present. When a single provider/model consistently fails across rounds in a dispatch session, treat it as a provider availability issue (report in reviewer-failed lists) rather than a blocker — the dispatch tool does not offer per-run retry within a round, and re-dispatching solely to recover one failed reviewer re-runs the whole panel at cost.
