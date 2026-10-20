---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T12:50:28Z
identity: documentation-pipeline-20261020T125028-jay-flowers
tier: draft
---

When a change renumbers or re-bases workflow step references (e.g., /uf.unleash's 8-step pipeline), the cross-reference audit must extend beyond the rewritten file to every living document that cites those step numbers — AGENTS.md, README, docs/, command and agent files. In the unleash-tier-routing change, task 9.3 fixed the quick-implement "Step 8" bug and 15 sibling references inside uf.unleash.md (live + scaffold mirror) but skipped AGENTS.md, leaving two stale "runs in /uf.unleash Step 8" review-council references after the canonical numbering made Code Review Step 6 and Demo Step 8. A repo-wide grep for the renumbered token (e.g., "uf\.unleash.*Step [0-9]") catches these in seconds.
