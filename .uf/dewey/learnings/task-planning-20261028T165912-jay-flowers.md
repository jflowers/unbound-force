---
tag: task-planning
author: jay-flowers
category: gotcha
created_at: 2026-10-28T16:59:12Z
identity: task-planning-20261028T165912-jay-flowers
tier: draft
---

[P] parallel-marker decisions must consider every branch of a task, not just its primary deliverable. derive-per-run-timeout task 8.3's fallback branch ("otherwise record the internal-tooling exemption rationale in the CHANGELOG.md entry from task 8.2") writes the same file task 8.2 creates, so both-[P] execution can lose an edit — and the fallback was the likely branch since the proposal classified the change as internal. When a task has conditional file writes, check the writing branch against every other [P] task in the group before marking it [P].
