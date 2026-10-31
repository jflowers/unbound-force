---
tag: scaffold
author: jay-flowers
category: gotcha
created_at: 2026-10-31T02:41:39Z
identity: scaffold-20261031T024139-jay-flowers
tier: draft
---

Scaffold heading-marker idempotency false-suppression correlates with the target population rather than being an edge case: repos that already document their sibling repositories in AGENTS.md under a "## Sibling Repositories" heading (dewey ships an org-repos table under exactly that heading) are precisely the repos most likely to declare .uf/sibling-repos.yaml, so ensureAGENTSmdSiblingSection's heading-only strings.Contains probe skips the UF permission-safety guidance on the highest-affinity targets while reporting "already configured". General rule: when an append function's activation gate and its idempotency marker both key off the same concept (siblings here), heading collision is structural, not incidental — probe for tool-specific content inside the section (e.g., "acquire_sibling_evidence") or emit a distinct heading-present-content-differs action string so suppression is distinguishable from prior deployment.
