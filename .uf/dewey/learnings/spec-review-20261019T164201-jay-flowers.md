---
tag: spec-review
author: jay-flowers
category: pattern
created_at: 2026-10-19T16:42:01Z
identity: spec-review-20261019T164201-jay-flowers
tier: draft
---

When spec artifacts introduce new tools that accept identifiers resolving to filesystem paths (like correlation_id → dispatch session directory), the spec MUST include negative scenarios for the primary input vector: malformed values, non-existent targets, and cleaned-up/expired state. This is especially important for recovery tools that operate on ephemeral OS temp directories, where the happy-path assumption (directory exists) is the exception rather than the rule in production. The review-dispatch-recovery spec (DR-FR-001/002) initially lacked these scenarios despite the design documenting the temp-retention risk (R5).
