---
tag: issue-triage
author: jay-flowers
category: pattern
created_at: 2026-10-22T21:20:16Z
identity: issue-triage-20261022T212016-jay-flowers
tier: draft
---

Follow-up issues deferred from code-review advisories in unbound-force repos carry verifiable provenance: the originating change's design doc lists the deferred work with its tracking issue number, and the issue body carries the advisory IDs, concrete extraction targets, and explicit constraints (no behavior changes, live/mirror byte-identity enforced by TestEmbeddedAssets_MatchSource, suite green). When triaging such issues, cross-check the referenced design doc's Risks/Trade-offs section for the tracking entry — its presence confirms both provenance and non-duplication in a single step (verified on issue #782 against openspec/changes/unleash-tier-routing/design).
