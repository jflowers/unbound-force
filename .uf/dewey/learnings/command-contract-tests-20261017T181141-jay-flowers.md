---
tag: command-contract-tests
author: jay-flowers
category: pattern
created_at: 2026-10-17T18:11:41Z
identity: command-contract-tests-20261017T181141-jay-flowers
tier: draft
---

When a prose-to-tool migration spec enumerates MUST call sites across multiple ADDED requirements, derive the command-content pin suite from the union of all enumerated call sites at authoring time. Feedback-driven pin extension — adding pins only for call sites called out in review rounds — systematically under-covers the requirements that drew no feedback in the same diff. In opsx/unleash-deterministic-tools, TestUnleashCommand_ToolRoutingContracts pinned the 4 delegation sites and 2 formatter invocations from earlier feedback rounds while 7 of 8 format_unleash_exit variants and 6 other enumerated tool invocations (uf_unleash_branch_gate, uf_unleash_detect_resume, scan_clarifications, resolve_clarification, parse_tasks, mark_task_complete, scan_conflict_markers) remained unpinned until review caught the gap.
