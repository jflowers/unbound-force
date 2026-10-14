---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-14T15:15:40Z
identity: openspec-20261014T151540-jay-flowers
tier: draft
---

OpenSpec tasks.md [P] (parallel-eligible) markers require a same-file collision check across the entire task group, and the check must be re-run whenever a task is added during spec refinement. In determinism-codification, tasks 1.1 and 1.9 both edited .specify/memory/constitution.md (including the same SYNC IMPACT REPORT comment) while both carried [P], contradicting the template's "Do NOT add [P] when tasks modify the same file" rule and the group preamble's "all tasks touch different files" claim. Late-added reconciliation tasks are the usual culprit — merge them into the file-owning task or drop the [P] marker.
