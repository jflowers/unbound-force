---
tag: spec-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-30T19:49:26Z
identity: spec-workflow-20261030T194926-jay-flowers
tier: draft
---

When a tasks.md uses a fully-specified pattern-setter task followed by 'apply the same pattern' tasks with parenthetical enumerations, the enumerations silently become the de facto scope. In forward-aggregate-correlation-id, task 2.1 defines three prose edits (capture, pass-ID, failure-mode reclassification per design D5) but tasks 2.2-2.5 enumerate only the call-site edits, dropping the reclassification that spec scenario RD-CF-001 #6 mandates for every command file. Derivative-task enumerations must either be complete or explicitly state they inherit the pattern-setter's full scope.
