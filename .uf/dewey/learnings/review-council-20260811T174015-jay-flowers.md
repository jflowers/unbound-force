---
tag: review-council
author: jay-flowers
category: gotcha
created_at: 2026-08-11T17:40:15Z
identity: review-council-20260811T174015-jay-flowers
tier: draft
---

When running the /uf.review-council pipeline, do NOT halt between steps to wait for user confirmation. The pipeline has no explicit gate points requiring user input. Continue through all steps (spec review, implementation, code review, retrospective, demo) without stopping unless there is a genuine blocking condition like a REQUEST CHANGES verdict requiring user decision. Halting at invented gates wastes user time and breaks flow.
