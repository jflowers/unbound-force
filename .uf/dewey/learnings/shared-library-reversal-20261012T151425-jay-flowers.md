---
tag: shared-library-reversal
author: jay-flowers
category: pattern
created_at: 2026-10-12T15:14:25Z
identity: shared-library-reversal-20261012T151425-jay-flowers
tier: draft
---

When reversing a shared library extraction (moving a function from a shared lib back to a single consumer), the architectural review should verify that the reversal is justified in the active spec's design decisions. If the original extraction was documented with architectural rationale (e.g., 'Avoids duplicating host-model resolution logic across two plugins'), reversing it without a corresponding design justification creates an undocumented architectural regression.
