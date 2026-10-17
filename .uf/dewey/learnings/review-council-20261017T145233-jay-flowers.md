---
tag: review-council
author: jay-flowers
category: pattern
created_at: 2026-10-17T14:52:33Z
identity: review-council-20261017T145233-jay-flowers
tier: draft
---

When the head commit of a re-reviewed PR is itself a learnings-only increment, every diff learning postdates the last fix commit, so the latest-round learnings act as a fresh review queue. Disposition each newest learning by owning domain via its tag (uf-workflow-testing → Tester, plugin-architecture → Architect, review-council/documentation-gate → Curator) instead of converting cross-domain observations into out-of-scope findings; a domain-appropriate learning committed at head documents the gap for the owning agent without polluting this round's findings. Observed on PR 745 unleash-deterministic-tools round 5 (head f0327a9, 65 learnings): uf-workflow-testing-20261017T142218 documents still-missing catch-all tests (FORMAT_UNLEASH_DEMO_ERROR, SCAN_CLARIFICATIONS_ERROR, RESOLVE_CLARIFICATION_ERROR — verified absent at head, left to Tester), plugin-architecture-20261017T123523 documents traversal-envelope duplication at 8 sites (Architect domain), while the Curator's queue item dewey-20261017T142212 (misspelled dewley/ directory concern) was settled offline with a direct .uf/ directory read showing only the canonical dewey/ path — no finding needed.
