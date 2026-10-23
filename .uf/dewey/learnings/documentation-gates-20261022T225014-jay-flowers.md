---
tag: documentation-gates
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:50:14Z
identity: documentation-gates-20261022T225014-jay-flowers
tier: draft
---

Unbound Force user-facing workflow changes must satisfy two distinct documentation-issue gates before PR merge: the AGENTS.md repo-local gate (documentation issue against the current repo) and the org constitution's Cross-Repo Documentation gate (tracking issue in unbound-force/website). Enumerating the AGENTS.md doc-gate targets (CHANGELOG/AGENTS/README/docs) and recording a blog-opportunity judgment does not satisfy the website-repo requirement — the two are frequently conflated in proposal Documentation Impact sections. Proposals should record both issue numbers in the Documentation Impact section and label each doc-issue task with the specific gate it satisfies. (Branch opsx/spec-review-per-finding-gate, 2026-10-22.)
