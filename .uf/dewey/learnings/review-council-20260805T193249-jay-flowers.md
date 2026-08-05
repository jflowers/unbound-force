---
tag: review-council
author: jay-flowers
category: gotcha
created_at: 2026-08-05T19:32:49Z
identity: review-council-20260805T193249-jay-flowers
tier: draft
---

The Guard reviewer incorrectly flagged that the scaffold copy at internal/scaffold/assets/opencode/commands/uf.review-pr.md needed to be updated alongside the canonical .opencode/commands/uf.review-pr.md. Investigation revealed that no such scaffold copy exists — uf.review-pr.md is NOT in the scaffold assets directory. When a reviewer claims a file needs parallel updates, always verify the file actually exists before adding it to the task list. False positives about scaffold copies can waste time and introduce confusion.
