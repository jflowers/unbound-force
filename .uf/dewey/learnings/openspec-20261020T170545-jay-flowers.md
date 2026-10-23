---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-20T17:05:45Z
identity: openspec-20261020T170545-jay-flowers
tier: draft
---

When requirement IDs are renumbered mid-change (e.g., RD-FR-009..011 → RD-FR-025..027 after a sibling-change ID collision fix), sweep ALL committed artifacts for old IDs — spec deltas, tasks, design, proposal, CHANGELOG, AND .uf/dewey/learnings/ files. Stale requirement citations in learnings feed Dewey retrieval and mislead future reviews (a learning on PR #776 still cited reserved RD-FR-009 for RD-FR-025 behavior after the renumbering sweep).
