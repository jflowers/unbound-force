---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:11:16Z
identity: openspec-20261020T001116-jay-flowers
tier: draft
---

In OpenSpec changes, a design decision that reverses a mechanism described in the proposal must be reconciled across all artifacts in the same change. In unleash-tier-routing, design D6 replaced the proposal's `.uf/artifacts/unleash/<branch>.md` quick-tier progress artifact with checkpoint-state derivation, but the proposal still describes the rejected artifact in two places — leaving a described mechanism with no task, no test, and no implementation, and breaking requirement-traceability audits that start from the proposal.
