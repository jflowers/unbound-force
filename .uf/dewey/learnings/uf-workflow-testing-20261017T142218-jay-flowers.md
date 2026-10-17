---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-17T14:22:18Z
identity: uf-workflow-testing-20261017T142218-jay-flowers
tier: draft
---

When a tool family shares a mutation or failure primitive (e.g., recordAutoCheckpoint fail-closed catch-alls, corrupt-read outer catch-alls), enumerate every family member's catch-all error code literal in the same change and grep the test tree for each one before approving. In the unleash-deterministic-tools review (PR 745), earlier family members each shipped catch-all tests (gate→BRANCH_GATE_ERROR, delegate→DELEGATE_ERROR, detect_resume→RESUME_DETECT_ERROR, tasks→corruptReads→TASKS_READ_ERROR), but the newest members were systematically skipped (format_unleash_demo→FORMAT_UNLEASH_DEMO_ERROR, scan_clarifications→SCAN_CLARIFICATIONS_ERROR, resolve_clarification→RESOLVE_CLARIFICATION_ERROR). Pattern: when adding a new member to an existing tool family, copy the family's complete test-pattern set (happy path, contract pins, fail-closed catch-all) — the newest member is the one that gets skipped, because the family's existing tests create a false impression that the pattern is already covered.
