---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-19T15:35:14Z
identity: uf-workflow-20261019T153514-jay-flowers
tier: draft
---

Fallback values that are raw grammar syntax become self-perpetuating when logged verbatim into a document the same grammar scans. In uf-workflow, bare-marker questions fall back to the raw marker text, resolve_clarification logs `- Q: <question>` verbatim into the ## Clarifications section of spec.md, and countClarificationMarkers/replaceClarificationMarker scan the whole file with no section exclusion — so resolving a fallback-form marker writes a new grammar match into the log, `remaining` never reaches 0, clarify never completes via tooling, and each cycle appends a degraded log entry. Audit every fallback-to-log round trip where the log lives inside the scanned document: either transform the fallback into a non-matching form at the logging boundary or exclude the log section from the scan/count/replace passes.
