---
tag: add-todowrite-to-pipelines
author: jay-flowers
category: gotcha
created_at: 2026-08-29T19:30:47Z
identity: add-todowrite-to-pipelines-20260829T193047-jay-flowers
tier: draft
---

When modifying pipeline command templates (.opencode/commands/uf.*.md) to add new instruction sections, the execution checklist within the template file gets modified during the pipeline run itself (marking steps [x] as they complete). These session-state marks MUST be reset to [ ] before committing, otherwise the template ships with stale session state baked in. During the add-todowrite-to-pipelines implementation, the execution checklist had Steps 0-7 marked [x] from the current session, which needed to be reverted to clean [ ] state before the diff was finalized. Always verify the execution checklist is clean (all [ ]) in the committed version of any modified pipeline command template.
