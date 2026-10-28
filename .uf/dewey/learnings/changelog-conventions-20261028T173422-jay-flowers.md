---
tag: changelog-conventions
author: jay-flowers
category: gotcha
created_at: 2026-10-28T17:34:22Z
identity: changelog-conventions-20261028T173422-jay-flowers
tier: draft
---

When a spec artifact pins an exact output format by citing a sibling change as precedent, the pinned format inherits only that sibling's metadata shape, and conditional convention elements get silently dropped. Verified on port-uf-rebase-pr spec review iteration 2 (2026-10-28): tasks.md task 3.4 and the spec's Documentation-updates requirement pinned the CHANGELOG entry's final reference line as (Spec: ...) + (Docs: ...), citing the replicator-version-floor entry as the format precedent — but replicator-version-floor carries no originating_issue in .openspec.yaml, so its entry correctly lacks a Fixes/Closes reference, while this change carries originating_issue: 851 and repo convention (five shipped precedents: review-voice-pack #657, spec-review-per-finding-gate #777, ts-plugin-coverage-gate #780, spawn-subtask-classification-params #830, fix-review-dispatch-correlation-release #794) requires `Fixes: #NNN` in the final line when .openspec.yaml records an originating issue. Reviewer check: whenever a spec pins a format by precedent, diff the pinned elements against every convention keyed to the change's OWN metadata (originating_issue, docs-gate issue numbers, website-sync issue) rather than only against the cited sibling — a precedent with a different metadata shape transfers an incomplete template.
