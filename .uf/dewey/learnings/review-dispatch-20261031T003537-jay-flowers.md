---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-31T00:35:37Z
identity: review-dispatch-20261031T003537-jay-flowers
tier: draft
---

Spec-scenario to test-lock traceability: the forward-aggregate-correlation-id change (issue #872; reviewed 2026-10-30) locked every RD-CF-001 scenario (four behavioral cross-session tests at .opencode/test/dispatch-review-runs.test.ts:826-1026 plus two Go phrase-contract locks in internal/scaffold/command_contract_test.go), RD-CF-003 (registration-surface schema lock, .opencode/test/registration-surface.test.ts:223-289), and RD-CF-002's mirror-identity scenario (pre-existing scaffold drift tests) — but RD-CF-002's 'Description carries forwarding guidance' scenario shipped with no lock. Root cause: design D7 enumerated locks by mechanism (suite / schema lock / phrase contracts / label refresh) rather than by scenario, so one scenario fell through every lock's scope. The sentence is deletable from both the plugin source and its scaffold mirror with every test green: drift tests prove only mirror==source, the registration-surface loop checks only typeof description === 'string', and the phrase contracts read command files. The codebase already had the fix pattern — tool-description content locks via expect(toolDef.description).toContain(...): dispatch-review-runs.test.ts:186, dispatch-agent-run.test.ts:1211, sibling-evidence.test.ts:218, invoke-agent.test.ts:507. Pattern: when a change ships a spec delta, enumerate every scenario per requirement and map each to a concrete lock (or a recorded, justified exemption) before declaring the test strategy complete; tool-surface prose contracts close with a one-line toContain on the registered description.
