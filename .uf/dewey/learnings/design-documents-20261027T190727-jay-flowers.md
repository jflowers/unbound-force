---
tag: design-documents
author: jay-flowers
category: pattern
created_at: 2026-10-27T19:07:27Z
identity: design-documents-20261027T190727-jay-flowers
tier: draft
---

When a review round finds that a design doc's rejected-alternatives analysis missed a real existing implementation (e.g., a second strict three-part version parser in the same file), the remediation that closes the DRY finding is amending the design decision with the complete inventory survey — naming every existing vocabulary, the closest candidate, and the precise semantic divergence per reuse candidate — rather than forcing consolidation. In the replicator-version-floor change (round 2), design.md D4 gained a note surveying the previously missed parseExactSemver/parseSemverComponent pair (anchored single-line pattern, leading-zero rejection, uint32 bounds, (uint32, error) shape) against the floor parser's requirements (token-after-keyword extraction from git-describe output, suffix cutting, padded-core acceptance, int components, (int, ok) fail-closed contract). The divergence became documented and intentional, and the round-1 finding closed without behavior change. The general rule: an undocumented duplicate is a DRY violation; a documented, semantically-justified divergence with a factual inventory survey is a design decision.
