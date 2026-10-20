---
tag: spec-authoring
author: jay-flowers
category: pattern
created_at: 2026-10-20T12:50:26Z
identity: spec-authoring-20261020T125026-jay-flowers
tier: draft
---

Spec-review pattern (recurred across two review rounds of the unleash change family): when one OpenSpec change amends a pending sibling change, reconcile ALL of the sibling's artifacts — proposal.md, design.md, specs delta, AND tasks.md — not just the files carrying the technical edit. Partial sibling amendments leave the sibling's checked tasks and proposal contradicting its own amended spec (the inter-change form of intra-change proposal/design drift). Related: (1) any mitigation described as "recorded in both changes" must be verified against the sibling's actual content and encoded where the sibling enforces decisions (its archive-gate task pattern) — a prose claim of dual recording with no reciprocal artifact is a false anchor that archives permanently; (2) a cross-reference audit that canonicalizes a numbering scheme must sweep every consumer of that numbering (AGENTS.md, pending changes), not just the renamed file.
