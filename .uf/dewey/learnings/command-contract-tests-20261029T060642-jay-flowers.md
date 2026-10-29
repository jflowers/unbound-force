---
tag: command-contract-tests
author: jay-flowers
category: pattern
created_at: 2026-10-29T06:06:42Z
identity: command-contract-tests-20261029T060642-jay-flowers
tier: draft
---

When a markdown workflow command's spec declares "pinned invocations" (exact gh CLI calls with fixed JSON field lists), the structural command-contract test is the only mechanism that catches joint drift of those invocations across the canonical file and its byte-identical scaffold mirror — mirror drift tests stay green when both copies are edited together. Pin the invocation strings themselves (e.g. `gh pr checks <PR_NUMBER> --json name,state,bucket,link`), not only the choreography around them: the field lists are the data contract downstream phases consume (link → run-id derivation, mergeable/mergeStateStatus → path selection). Observed in the uf-fix-ci review (opsx/uf-fix-ci, iteration 2): TestCommandContracts_FixCiCommandStructure pins 19 invariant groups plus the run-id regex `^[0-9]+$` and pins the `gh run rerun` invocation verbatim, yet omitted the two FR-002 fetch invocations — and companion issue #861 is scheduled to rewire exactly those invocation lines, making the gap near-term rather than hypothetical. Derive clause inventories from the spec's normative invocation strings, not from the task list's enumeration.
