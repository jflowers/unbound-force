---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-16T20:24:20Z
identity: uf-workflow-testing-20261016T202420-jay-flowers
tier: draft
---

When a command-prose migration replaces a prior bug-fix invocation with a plugin tool, extend the command-layer contract test in the same change to pin the new invocation's tool name AND its parameter block — a bare tool-name Contains assertion passes a stale-signature call (the tool name string is still present; only the parameters differ), and soft-fail warn-and-continue paths mask INVALID_INPUT failures at the pipeline level. The parameter names (e.g. change_name, review_verdicts, learnings_stored for write_unleash_summary vs. the deprecated 3-argument persist_unleash_summary) are what distinguish the current contract from the deprecated one. Also pin the span explicitly: in TestUnleashCommand_WorkflowTierBranching, demoNextSteps = between(command, "4. **Next Steps**:", "Then persist the summary") ends BEFORE the write_unleash_summary invocation block, so the new assertion needs its own span (e.g. from "Then persist the summary" to "## Guardrails"). Because scaffold drift tests enforce byte-identity between .opencode/commands/ and internal/scaffold/assets/, one assertion on the embedded copy pins both files.
