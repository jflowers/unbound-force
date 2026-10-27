---
tag: zod-validation
author: jay-flowers
category: gotcha
created_at: 2026-10-27T01:14:36Z
identity: zod-validation-20261027T011436-jay-flowers
tier: draft
---

zod 4 keeps .shape accessible after .superRefine(): refinements attach checks to the schema and return the same object type instead of wrapping in ZodEffects as zod 3 did (the plugin runtime pins zod 4.1.8). The unleash-interactive-clarify change relies on this in .opencode/plugins/uf-workflow/index.ts: ResolveClarificationInputSchema chains .object({...}).strict().superRefine(...) for the fail-closed conditional source-vs-resolved_by validation, and the resolve_clarification tool registration still reads ResolveClarificationInputSchema.shape.resolved_by.describe(...) alongside the pre-existing .shape.feature_dir/.question/.answer/.source reads. Under zod 3 that .shape access on a refined schema would be a runtime TypeError at tool-factory time. When adding cross-field refinements to tool input schemas in .opencode/plugins/, arg descriptions can keep sourcing .shape from the refined schema, but any zod major-version change must re-verify this property before the schema chain is considered portable.
