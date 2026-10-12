---
tag: scaffold-drift
author: jay-flowers
category: gotcha
created_at: 2026-10-12T00:53:53Z
identity: scaffold-drift-20261012T005353-jay-flowers
tier: draft
---

Scaffold drift is a recurring gotcha when modifying .opencode/ plugin files. The internal/scaffold/assets/opencode/ directory must mirror changes to agent-executor.ts, invoke-agent/index.ts, review-dispatch/index.ts, and command templates like uf.unleash.md. The scaffold drift tests in internal/scaffold/ compare SHA256 checksums of source files against their scaffold copies. Always run make check after implementation to catch drift before the code review phase. A single cp command per drifted file is the fix, but forgetting any file causes test failures that block the pipeline.
