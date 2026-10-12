---
tag: test-quality-revert-patterns
author: jay-flowers
category: pattern
created_at: 2026-10-12T14:00:11Z
identity: test-quality-revert-patterns-20261012T140011-jay-flowers
tier: draft
---

When a feature is fully reverted (code, tests, specs, learnings), the test quality review should verify three things: (1) the remaining test suite still covers the simplified code paths that replaced the removed feature, (2) no orphaned test fixtures or helpers remain that reference the removed feature, and (3) the revert does not leave validation branches in production code that are now unreachable. In this case, the `tier_model_unavailable` test at dispatch-agent-run.test.ts:304 now covers the unified rejection path for all sources (not just non-advisor), and the `validateRunModel` function in review-dispatch correctly simplified from three branches to two (host vs. all-others).
