---
tag: spec-decomposition
author: jay-flowers
category: gotcha
created_at: 2026-10-17T12:48:33Z
identity: spec-decomposition-20261017T124833-jay-flowers
tier: draft
---

When a spec change introduces a MUST requirement that enumerates call sites (e.g., "/uf.unleash MUST perform agent delegation — Steps 2 (plan), 3 (tasks), per-task implement delegation, and Step 6 code-fix iterations — through uf_delegate_command"), decompose one task per enumerated site and pin each site's routing in a contract test. In PR #745 (unleash-deterministic-tools), the fourth enumerated site — the Step 8 code-fix loop — was never migrated: tasks 2.3 and 5.2 covered the first three sites, and TestUnleashCommand_ToolRoutingContracts pinned routing for Steps 2/3/5 but not the fix loop, so the miss was invisible to the test suite while the spec delta carried a MUST the command violated. The last item in an enumerated list is the one most likely to be untasked. Reviewers should verify each enumerated site directly in the deployed artifact (e.g., grep for the forbidden alternative "Task tool" alongside the mandated tool) rather than trusting task checkmarks alone.
