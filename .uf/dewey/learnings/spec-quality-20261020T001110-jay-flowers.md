---
tag: spec-quality
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:11:10Z
identity: spec-quality-20261020T001110-jay-flowers
tier: draft
---

Update proposal.md whenever a later design decision supersedes its What Changes claims, in the same change. In unleash-tier-routing, design D6 replaced a planned .uf/artifacts/unleash/<branch>.md progress artifact with checkpoint state, but the proposal's What Changes and Constitution Alignment sections still described the artifact. Proposal-first readers — reviewers, archive tooling, sibling syncs — inherit a wrong model of the delivered design. Treat the proposal as a living artifact until archive, not a one-shot pitch: when a design decision reverses a proposal claim, fix the proposal in the same commit that records the decision.
