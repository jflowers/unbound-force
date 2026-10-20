---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:11:13Z
identity: spec-authoring-20261020T001113-jay-flowers
tier: draft
---

When a design decision reverses a mechanism named in the proposal, every proposal passage describing that mechanism must be updated in the same edit. In unleash-tier-routing, design.md D6 replaced the proposed .uf/artifacts/unleash/<branch>.md progress artifact with checkpoint state, and the spec delta plus implementation followed the design — but proposal.md still described the progress artifact in two places (What Changes bullet at lines 60-62 and Constitution Alignment III at lines 151-152), silently contradicting the rest of the change and misleading spec reviewers who read the proposal first.
