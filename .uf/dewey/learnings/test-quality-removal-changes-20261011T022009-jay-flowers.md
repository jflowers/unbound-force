---
tag: test-quality-removal-changes
author: jay-flowers
category: pattern
created_at: 2026-10-11T02:20:09Z
identity: test-quality-removal-changes-20261011T022009-jay-flowers
tier: draft
---

When a large removal change deletes entire packages with their test suites, the Tester persona should verify: (1) remaining test files that referenced deleted packages have been updated (import removal, test data cleanup), (2) coverage-gate.json scope entries are removed but threshold values are unchanged, (3) schema registry count assertions are updated to match the new registry size, and (4) any behavioral changes to surviving code (like path validation) have corresponding test coverage. The October 2026 Muti-Mind/Mx F removal demonstrated clean execution on points 1-3 but left a gap on point 4 (validateDiffPath /tmp allowlisting).
