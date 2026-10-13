---
tag: typescript-plugin-testing
author: jay-flowers
category: pattern
created_at: 2026-10-12T23:56:25Z
identity: typescript-plugin-testing-20261012T235625-jay-flowers
tier: draft
---

The uf-finale plugin demonstrates an effective pattern for MCP plugin tool testing with dependency injection. Each tool factory accepts a GitExec function and cwd parameter, enabling mock injection. For gh CLI calls that use execSync directly, module-level vi.mock("node:child_process") with importOriginal provides partial mocking. Key test patterns: (1) A shared invokeTool<T> helper that calls the tool's execute handler and parses the JSON output into a typed ToolResult discriminated union. (2) vi.useFakeTimers with try/finally for polling loop tests (ci_poll). (3) Separate test cases for Error vs non-Error throw paths to exercise String(err) branches. (4) Security-focused tests for input validation (INVALID_TARGET_REPO format validation, INVALID_PR_NUMBER with NaN/0/1000000 edge cases). The final suite has 572 tests across 23 files with 85%+ branch coverage.
