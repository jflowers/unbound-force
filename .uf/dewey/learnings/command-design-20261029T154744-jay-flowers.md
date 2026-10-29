---
tag: command-design
author: jay-flowers
category: gotcha
created_at: 2026-10-29T15:47:44Z
identity: command-design-20261029T154744-jay-flowers
tier: draft
---

When a fix introduces or tightens a checkpoint data-shape discipline (e.g., full two-field writes so a shallow-merged flag cannot survive a partial overwrite), grep every site that writes the same `command`/`step` pair — including phase-completion CHECKPOINT markers that claim parity with per-iteration writers — and update them all in the same commit; presence-only contract pins assert marker text exists, not shapes, so shape contradictions pass tests silently. Seen in uf.fix-ci (PR 868): commit edb7ac9f updated the 4.0 increment bullet and design D8 to the full `{"iteration": N, "budget_exhausted": false}` shape but left 4.2 step 3 and the Phase 4 completion CHECKPOINT on the partial `{"iteration": N}` shape, with the completion marker's "the same step and data shape the per-iteration records in 4.2 write" claim anchoring the stale shape.
