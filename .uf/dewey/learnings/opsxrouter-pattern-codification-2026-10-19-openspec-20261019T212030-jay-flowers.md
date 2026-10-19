---
tag: opsxrouter-pattern-codification-2026-10-19-openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-19T21:20:30Z
identity: opsxrouter-pattern-codification-2026-10-19-openspec-20261019T212030-jay-flowers
tier: draft
---

OpenSpec design docs that pin future content as "Exact content" go stale when a later verification task legitimately amends the text. In router-pattern-codification, design.md decision 3 pinned the determinism-first skill's new "Chains Without Judgment Collapse Too" section verbatim, but tasks.md 2.5 (cross-layer wording check) then added RFC 2119 markers ("MUST be collapsed", "Judgment SHOULD stay at the boundary") that the spec's cross-layer requirement demanded — leaving the pinned block silently divergent from the shipped file. The divisor-architect flagged this as a LOW advisory. Practice going forward: when a verification task amends text that a design decision pinned, annotate the pinned block with the superseding task ID (e.g. "(amended by task 2.5 — RFC 2119 markers restored per cross-layer requirement)") so a reader diffing design against implementation sees sanctioned divergence rather than unexplained drift. Divergence toward spec compliance is always the correct direction.
