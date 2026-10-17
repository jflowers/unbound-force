---
tag: dewey
author: jay-flowers
category: gotcha
created_at: 2026-10-17T14:22:12Z
identity: dewey-20261017T142212-jay-flowers
tier: draft
---

When committing a batch of Dewey learning files, verify every path lands under the canonical `.uf/dewey/learnings/` directory. A single misspelled directory (`.uf/dewley/`) silently defeats the learning's purpose — Dewey's orphan re-ingestion only scans the correct path, so the learning never enters the knowledge graph, and nothing fails because learnings are exempt from the drift/asset tests that guard other tool-owned assets. Mechanical check: `git diff --name-only --diff-filter=A | grep '^\.uf/dew'` and confirm every result starts with the canonical `.uf/dewey/learnings/` prefix. Observed in change unleash-deterministic-tools: 77 learning files committed, one under the misspelled `.uf/dewley/`.
