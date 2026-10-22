---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-22T13:00:04Z
identity: test-quality-20261022T130004-jay-flowers
tier: draft
---

When production code distinguishes an absent optional field (undefined) from a provided default, a test double computing `options.field ?? "default"` collapses the absent case into the default and silently masks the absent-field code path. Prefer `"field" in options ? options.field : "default"` in fakes so absence is preserved. Evidence: unleash-delegate.test.ts's fakeClient had to switch from `options.hostVariant ?? "default"` to `"hostVariant" in options ? options.hostVariant : "default"` before the absent-variant host-model fallback (added in the unleash-pipeline-hardening change) could be exercised at all.
