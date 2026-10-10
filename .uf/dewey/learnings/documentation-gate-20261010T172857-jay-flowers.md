---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-10T17:28:57Z
identity: documentation-gate-20261010T172857-jay-flowers
tier: draft
---

During the fetch-pr-review-context code review (October 2026), the divisor-curator agent caught that no documentation issue had been filed for the new user-facing tool, which was a HIGH-severity finding that blocked APPROVE. The AGENTS.md documentation gate rule requires a GitHub issue for user-facing changes before PR merge. The tool was initially classified as internal-only (called by other review-dispatch tools), but the curator correctly identified it as user-facing because it appears in the plugin's tool list and could be invoked directly by agents. GitHub issue #696 was filed to satisfy the gate. This pattern will recur: any new tool registered in a plugin's server() method is user-facing by definition, even if it's primarily consumed by other tools in the same pipeline.
