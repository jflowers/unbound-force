---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-08-14T17:47:36Z
identity: uf-unleash-20260814T174736-jay-flowers
tier: draft
---

The /uf.unleash command requires strict autonomous execution through all 10 steps without pausing for human confirmation. The only valid exit points are: unanswerable clarification questions, HIGH/CRITICAL spec findings, build/test failures, merge conflicts, and 3 review iterations exhausted. After code review passes, the pipeline must write the code-review marker to tasks.md, then proceed directly to retrospective (Step 9) and demo (Step 10) without asking the user what to do next. The execution checklist in the command file should be maintained in-place using the Edit tool as each step completes.
