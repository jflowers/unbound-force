---
tag: dispatch-review-runs
author: jay-flowers
category: pattern
created_at: 2026-10-09T15:11:33Z
identity: dispatch-review-runs-20261009T151133-jay-flowers
tier: draft
---

When introducing an aggregate tool that encapsulates multiple sequential tool calls (like dispatch_review_runs replacing acquire_sibling_evidence + build_review_prompts + dispatch_agent_run loops), Go contract tests in command_contract_test.go must be updated to reflect the new tool boundaries. The SharedContextAndToolBoundaries test checks for specific tool names across all command files. Adding a `usesAggregate bool` field to the test's command struct allows the same test to handle both aggregate commands (which use dispatch_review_runs) and individual commands (like speckit.testreview.md which still uses the individual tools). This split-path pattern in contract tests prevents false failures while maintaining coverage for both tool usage patterns.
