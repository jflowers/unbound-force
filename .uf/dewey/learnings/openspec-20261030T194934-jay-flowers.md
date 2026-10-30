---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-30T19:49:34Z
identity: openspec-20261030T194934-jay-flowers
tier: draft
---

When a tasks.md uses "apply the same pattern" shorthand across sibling files (task 2.1 sets the pattern; tasks 2.2-2.4 apply it to other files), each per-file task's parenthetical section enumeration must include every component of the pattern — capture prose, parameter pass-through at each call site, retry instructions, and any prose reclassification the primary task names — or explicitly defer to "all components of the 2.1 pattern". Partial enumerations read as exhaustive scope definitions to implementers and parallel [P] workers, so unlisted pattern components silently under-deliver, and contract-test locks scoped to the listed components will not catch the omission. Verified instance (forward-aggregate-correlation-id): tasks 2.2-2.4 omitted the design-D5 failure-mode reclassification required by the RD-CF-001 permanent-failure scenario, while three of the four target command files carry the identical "Permanent failure (a tool-reported error status, or a dispatch session that does not exist for a dispatch that executed runs)" classification clause that needed the edit.
