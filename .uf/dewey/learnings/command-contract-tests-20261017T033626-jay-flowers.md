---
tag: command-contract-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-17T03:36:26Z
identity: command-contract-tests-20261017T033626-jay-flowers
tier: draft
---

When pinning a tool invocation block in embedded command markdown via Go asset tests (the between() + strings.Contains pattern over assetContent), enumerate every labeled parameter present in the pinned span — derive the list from the tool's zod input schema, not from the routing-critical subset. Observed on PR 745 round 2: the new step-10 pin for write_unleash_summary checked 5 of 8 labeled params; the three demo-body params (whatWasBuilt/howToVerify/testResults) — required by WriteUnleashSummaryInputSchema and read back by /uf.finale from the persisted artifact — were unpinned across the entire Go prose-contract suite. A prose regression dropping them is detectable only at runtime INVALID_INPUT, where the command's warn-and-continue fallback silently degrades /uf.finale to no-artifact mode. TS-side tool tests cover the tool contract but cannot see command prose, so the Go pin is the only guard for command-to-tool parameter routing.
