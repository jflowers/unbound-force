---
tag: plugin-testing
author: jay-flowers
category: pattern
created_at: 2026-10-22T12:17:17Z
identity: plugin-testing-20261022T121717-jay-flowers
tier: draft
---

When a test fake must distinguish an explicitly-passed undefined from an absent key — e.g., verifying a delegate does NOT forward a variant field, or letting one fakeClient serve both "caller supplied a value" and "caller omitted the key" cases — use an "in" operator check ("hostVariant" in options ? options.hostVariant : "default") rather than nullish coalescing (??) or logical-or defaults, which erase the distinction. unleash-delegate.test.ts's fakeClient uses this pattern so individual tests can pin the exact absence/presence of hostVariant while the default path still works.
