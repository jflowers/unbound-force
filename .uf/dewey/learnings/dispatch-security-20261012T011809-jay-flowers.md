---
tag: dispatch-security
author: jay-flowers
category: pattern
created_at: 2026-10-12T01:18:09Z
identity: dispatch-security-20261012T011809-jay-flowers
tier: draft
---

When reviewing host-model fallback paths that gate on a `source` field value, verify the full validation chain: (1) the `source` field is validated by a Zod enum schema before reaching the comparison, (2) the comparison uses strict equality (`===`) with no normalization, and (3) unexpected values fall through to the existing rejection path. In this change, `input.source === "advisor"` is safe because `source` is validated by `z.enum(SOURCE_VALUES)` at the schema boundary — empty string, null, undefined, and case variations are rejected before the comparison executes. This defense-in-depth pattern (schema validation + strict equality) is the correct approach for security-relevant branching.
