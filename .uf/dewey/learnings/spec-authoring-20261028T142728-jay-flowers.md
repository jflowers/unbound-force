---
tag: spec-authoring
author: jay-flowers
category: pattern
created_at: 2026-10-28T14:27:28Z
identity: spec-authoring-20261028T142728-jay-flowers
tier: draft
---

The review matrix has a canonical JSON Schema registry at schemas/review-matrix/ (v2/v3 schemas, boundary samples in samples/, README version-history table) alongside the plugin's zod LimitsSchema in .opencode/plugins/review-dispatch/index.ts. Any change that adds or alters review-matrix fields must update BOTH surfaces - plus a review-matrix capability delta in the OpenSpec change (RD-FR-009..018 are reserved for future review-matrix changes per optional-profile-models) - or the two schema representations drift apart.
