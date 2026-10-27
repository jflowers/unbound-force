---
tag: review-process
author: jay-flowers
category: gotcha
created_at: 2026-10-26T10:51:36Z
identity: review-process-20261026T105136-jay-flowers
tier: draft
---

A retrospective learning that documents an open review finding does not close the finding. On branch opsx/spawn-subtask-classification-params, the committed learning recorded that the code-review council found .opencode/skills/speckit-workflow/SKILL.md and its scaffold mirror still composing forge_spawn_subtask calls without task_classification — yet the final PR diff neither fixed those files nor recorded a descope decision or a tracked follow-up issue, so the gap shipped unfixed and untracked because the learning read as methodology capture rather than as an open item. When a retrospective names a defect, either fix it in the same change or descope it explicitly with a tracked issue, and re-check the final diff against every finding the retrospective mentions before submitting.
