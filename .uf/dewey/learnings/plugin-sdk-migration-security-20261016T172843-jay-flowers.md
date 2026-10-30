---
tag: plugin-sdk-migration-security
author: jay-flowers
category: pattern
created_at: 2026-10-16T17:28:43Z
identity: plugin-sdk-migration-security-20261016T172843-jay-flowers
tier: draft
---

When a plugin SDK silently ignores an unrecognized declaration key (e.g., @opencode-ai/plugin ignoring `parameters:` in favor of `args:`), the migration to the correct key adds a new validation layer (zod schema validation) without removing any existing runtime guards. Security reviewers should verify three conditions: (1) execute bodies are byte-identical in the diff (no guard removal), (2) zod type/optionality matches the execute type annotations exactly (no widening or narrowing), and (3) no `.default()` values are introduced that could change runtime semantics for direct execute callers. When all three hold, the migration strictly improves the security posture by adding defense-in-depth.
