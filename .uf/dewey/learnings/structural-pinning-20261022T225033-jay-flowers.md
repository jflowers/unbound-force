---
tag: structural-pinning
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:50:33Z
identity: structural-pinning-20261022T225033-jay-flowers
tier: draft
---

When a prose-protocol rewrite ships with a structural pin suite (strings.Contains assertions over command assets), derive the pin list scenario-by-scenario from the spec's MUST clauses, not from the design's feature inventory. Observed reviewing spec-review-per-finding-gate (issue #777, 2026-10-22): the pin list in design D10 covered option labels, gate markers, the blocking rule, override recording, and the resume guard — but FR-001's visibility directive (finding text printed as session text ABOVE the question tool, the issue's headline ask) went unpinned because it was a requirement-body MUST with no corresponding entry in the design's enumerated pin scope. Recipe: for each FR, walk every MUST sentence and scenario THEN-clause and map it to at least one presence pin (or an absence pin for retired fragments); anything unmapped is a coverage gap by construction.
