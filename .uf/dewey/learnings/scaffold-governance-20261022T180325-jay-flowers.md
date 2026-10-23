---
tag: scaffold-governance
author: jay-flowers
category: pattern
created_at: 2026-10-22T18:03:25Z
identity: scaffold-governance-20261022T180325-jay-flowers
tier: draft
---

Scaffold-embedded command templates, plugin remediation text, and agent checklists must only reference governance artifacts that are also scaffold-embedded. Repo-local artifacts listed in knownNonEmbeddedFiles (currently the determinism pack and the determinism-first skill) dangle in hero repos after uf init sync: the scaffolded uf.unleash.md template, the uf-workflow plugin's error envelopes, and divisor-guard.md all reach hero repos, while the skills and packs they cite do not. The scaffolded skill set is always-on-guidance, dispatch-advisor, pre-flight, review-context, speckit-workflow, tier-routing — verify a referenced artifact is in that set (or scaffold it) before embedding a reference to it in a scaffolded source.
