---
tag: shared-library-extraction
author: jay-flowers
category: gotcha
created_at: 2026-10-12T14:00:07Z
identity: shared-library-extraction-20261012T140007-jay-flowers
tier: draft
---

When reverting a shared library extraction (moving a function from a shared lib back to a single consumer), verify that all copies of schemas and types that were unified during the extraction are reconciled. In this case, `VariantSchema` existed in both `invoke-agent` (with `.max(64)`) and `review-dispatch` (without `.max(64)`) before the shared extraction. The extraction unified them, but the revert re-introduced the divergence. The regex `{0,63}` provides an implicit length cap making the behavioral difference minimal, but the structural inconsistency creates a maintenance risk.
