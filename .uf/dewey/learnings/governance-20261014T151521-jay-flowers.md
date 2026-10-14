---
tag: governance
author: jay-flowers
category: pattern
created_at: 2026-10-14T15:15:21Z
identity: governance-20261014T151521-jay-flowers
tier: draft
---

Codifying a principle across multiple enforcement layers (constitution, AGENTS.md behavioral rule, convention pack, skill) intentionally restates the rule text in each layer because each layer loads in a different context: planning-time Constitution Check, every session, Divisor review prompts via readdir auto-discovery, and authoring-time skill discovery. Reviewers should treat the restatement as the mechanism, not a DRY violation — the real maintenance cost is cross-layer wording drift, which the design doc should acknowledge (see determinism-codification design decision 1). Auto-discovery was verified live: the new pack appears in Divisor review prompts with zero plugin changes, and make plugin-test (572 tests) confirmed no golden fixtures broke.
