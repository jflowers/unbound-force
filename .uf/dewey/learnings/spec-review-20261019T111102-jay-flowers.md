---
tag: spec-review
author: jay-flowers
category: gotcha
created_at: 2026-10-19T11:11:02Z
identity: spec-review-20261019T111102-jay-flowers
tier: draft
---

When a review iteration retrofits a declaration into a spec change (e.g., a maintainer-directed pinned-dependency update), sweep every artifact that states, summarizes, or records the affected claims — not only the artifacts that declare it. On opsx/clarification-marker-superset iteration 1, the D7 declaration reached design.md, the proposal's What Changes/Impact/Constitution II+V, and new tasks 2.2/2.3/5.4, but restating surfaces kept pre-revision text: task 6.1's constitution-verification summaries still read 'no new dependencies' with no D7 context, and task 5.1's CHANGELOG scope still describes only the grammar change although the bump alters scaffold-deployed manifests (this repo's changelog precedent records maintainer-approved gate changes inside the change entry). Revision-completeness checklist for declared retrofits: (1) every task that restates a revised claim, (2) every documentation task whose scope the declaration widens (CHANGELOG, AGENTS.md, docs pages), (3) verification tasks that summarize constitution alignment.
