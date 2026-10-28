---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-28T17:27:44Z
identity: spec-authoring-20261028T172744-jay-flowers
tier: draft
---

In this repository's tasks.md template, tasks WITHOUT the [P] marker run sequentially first, then [P] tasks run in parallel. A non-[P] task that depends on a [P] task in the same phase therefore has its dependency inverted: the dependent task executes in the earlier sequential group while its dependency executes later in the parallel group. When task N (non-[P]) must consume an artifact created by task M ([P]) in the same phase, either remove [P] from M so both run sequentially in listed order, or fold the dependent work into M. Verified against openspec/schemas/unbound-force/templates/tasks.md (execution-contract header) and the 100+ changes that carry it.
