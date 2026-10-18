---
tag: task-planning
author: jay-flowers
category: gotcha
created_at: 2026-10-17T22:21:43Z
identity: task-planning-20261017T222143-jay-flowers
tier: draft
---

OpenSpec [P] parallel-task markers require auditing shared evidence-recording destinations, not just primary deliverables. In command-prose-pilot tasks.md, Phase 3 tasks 3.1 (rg conformance checks) and 3.2 (make check) were both marked [P] while both record results into the same metrics.md file — violating the tasks.md header rule "Do NOT add [P] when tasks modify the same file" and creating a parallel-worker merge conflict. When tasks append evidence to a shared change-record file, either serialize them (drop [P]) or give each a distinct output file merged by a sequential follow-up task.
