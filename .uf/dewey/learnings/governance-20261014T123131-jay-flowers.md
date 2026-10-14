---
tag: governance
author: jay-flowers
category: pattern
created_at: 2026-10-14T12:31:31Z
identity: governance-20261014T123131-jay-flowers
tier: draft
---

When one governance rule is codified across multiple enforcement layers (constitution principle, AGENTS.md behavioral rule, convention pack, skill), the spec MUST pin the RFC 2119 classification per rule per layer. Layers with supremacy relationships cannot safely diverge: under the org constitution's Governance section, a pack-level SHOULD cannot relax a constitution-level MUST for the same normative content, so an unpinned constitution-layer classification lets implementation land contradictory force levels across layers. Observed in determinism-codification: the pack pins TD-002/TD-004 as SHOULD while the Principle VI rule-coverage requirement specifies no per-rule force and existing principle bodies are MUST-heavy by convention — the natural implementation creates a constitution MUST that the pack's SHOULD contradicts.
