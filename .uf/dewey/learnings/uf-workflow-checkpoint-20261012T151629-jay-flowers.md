---
tag: uf-workflow-checkpoint
author: jay-flowers
category: gotcha
created_at: 2026-10-12T15:16:29Z
identity: uf-workflow-checkpoint-20261012T151629-jay-flowers
tier: draft
---

When replacing an execution checklist pattern (static checkboxes maintained by Edit tool) with a plugin-based checkpoint system, the migration requires careful analysis of which command files actually use the pattern. In this change, 4 of 6 command files used the checklist pattern (uf.unleash.md, uf.finale.md, uf.review-council.md, uf.address-feedback.md) while 2 did not (uf.review-pr.md, uf.triage-issue.md). Marking the 2 no-op tasks as complete with explicit annotations explaining why they are no-ops prevents the review council from flagging them as incomplete work. The key lesson is: when tasks cover "all files matching pattern X", verify each file actually uses the pattern before implementation, and annotate no-ops explicitly in tasks.md.
