---
tag: review-dispatch-security
author: jay-flowers
category: pattern
created_at: 2026-10-12T00:50:43Z
identity: review-dispatch-security-20261012T005043-jay-flowers
tier: draft
---

When reviewing host-model resolution fallback paths in the dispatch system, verify that the `source` field comparison uses strict equality against a Zod-validated enum value, not raw string input. In this change, `input.source === "advisor"` is safe because `source` is validated by `z.enum(SOURCE_VALUES)` before reaching the comparison — unexpected values like empty string, null, or case variations are rejected at the schema boundary. This defense-in-depth pattern (schema validation + strict equality) prevents bypass of the fallback gate.
