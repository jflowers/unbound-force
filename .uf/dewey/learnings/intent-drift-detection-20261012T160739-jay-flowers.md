---
tag: intent-drift-detection
author: jay-flowers
category: gotcha
created_at: 2026-10-12T16:07:39Z
identity: intent-drift-detection-20261012T160739-jay-flowers
tier: draft
---

When a spec defines both MODIFIED and REMOVED requirements that affect the same file (e.g., replacing checkbox editing AND removing HTML comment markers in uf.unleash.md), the implementation must address both categories. It's easy to complete the MODIFIED requirement (replacing checkboxes with checkpoint calls) while overlooking the REMOVED requirement (eliminating HTML comment markers) because they appear in different sections of the spec. Task descriptions should explicitly enumerate both the additions and the removals for each file to prevent partial migration.
