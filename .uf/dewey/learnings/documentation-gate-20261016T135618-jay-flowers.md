---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-16T13:56:18Z
identity: documentation-gate-20261016T135618-jay-flowers
tier: draft
---

Unbound Force user-facing workflow changes carry two independent pre-PR-merge documentation requirements: (1) a docs-labeled issue in the current repo (AGENTS.md documentation gate) and (2) an issue in unbound-force/website (constitution Cross-Repo Documentation rule). During review, verify BOTH issue numbers exist and are open, confirm the current-repo issue carries the `docs` label, and check the website issue for label consistency with its siblings. The unleash-deterministic-tools change (tasks.md task 8.2) is the exemplar pattern: search for duplicates first, file both issues, record the issue numbers in tasks.md, and reference overlapping sibling issues in the body.
