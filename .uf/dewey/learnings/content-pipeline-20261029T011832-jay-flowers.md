---
tag: content-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-29T01:18:32Z
identity: content-pipeline-20261029T011832-jay-flowers
tier: draft
---

OpenSpec proposals that acknowledge blog/tutorial content opportunities in the Impact section but defer filing with permissive "may fold these in" language leave those follow-ups without a task-level carrier. Observed in openspec/changes/uf-fix-ci (proposal.md Impact "Content pipeline" bullet): the named carrier task (3.4, file both stacked documentation-gate issues) enumerates only the repo-local docs issue and the unbound-force/website tracking issue, not the acknowledged blog/tutorial items — so spec-time acknowledgment has no implementation-time verifiable deliverable. Pattern: when a proposal acknowledges content opportunities it does not file, anchor them to a concrete deliverable in the filing task — e.g., a labeled line-item list (blog:, tutorial:) specified as required content of the website tracking-issue body, or a dedicated sub-task — so "acknowledged" converts to checkable work instead of silently dropping.
