---
tag: openspec-parallel-markers
author: jay-flowers
category: gotcha
created_at: 2026-10-12T00:02:28Z
identity: openspec-parallel-markers-20261012T000228-jay-flowers
tier: draft
---

OpenSpec parallel markers ([P]) must be validated at the file level, not the task-independence level. Two tasks that add independent test cases to the same test file still violate the [P] contract because parallel workers will produce merge conflicts on that file. The tasks.md template header explicitly documents this rule, but it's easy to overlook when tasks are logically independent but physically co-located.
