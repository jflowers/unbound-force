---
tag: test-quality-defense-in-depth
author: jay-flowers
category: pattern
created_at: 2026-10-12T15:14:32Z
identity: test-quality-defense-in-depth-20261012T151432-jay-flowers
tier: draft
---

When testing defense-in-depth security layers (like path traversal checks behind input sanitization), the test suite should include at least one test that exercises the inner layer directly, even if the outer layer (sanitization) makes the inner layer unreachable through normal API calls. This ensures the defense-in-depth guard has regression protection independent of the sanitization layer.
