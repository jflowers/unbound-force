---
tag: test-coverage-bundled-fixes
author: jay-flowers
category: pattern
created_at: 2026-10-11T19:32:40Z
identity: test-coverage-bundled-fixes-20261011T193240-jay-flowers
tier: draft
---

When a large removal change includes an unrelated behavioral fix (e.g., broadening a path validation allowlist), the Tester persona should verify that the behavioral fix has its own test coverage, even if the fix is small. The October 2026 remove-mutimind-mxf-orchestration change bundled a /tmp path validation fix in review-dispatch/index.ts that broadened the security-relevant allowlist without adding a test case for the new code path. The fix is correct but untested — a regression could silently re-narrow the allowlist without detection.
