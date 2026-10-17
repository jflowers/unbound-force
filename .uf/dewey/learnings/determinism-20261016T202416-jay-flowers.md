---
tag: determinism
author: jay-flowers
category: pattern
created_at: 2026-10-16T20:24:16Z
identity: determinism-20261016T202416-jay-flowers
tier: draft
---

Prose→tool migrations (Constitution Principle VI / DE-001) move a workflow's regression contract from instruction templates to tool invocations, but scaffold drift tests only pin what they explicitly assert. In the uf.unleash deterministic-tools rewrite (PR #745), TestUnleashCommand_WorkflowTierBranching pinned format_unleash_exit and format_unleash_demo routing while the write_unleash_summary invocation — the command-layer half of the #707 null-unleashSummary fix — went unpinned: the demoNextSteps span boundary ("Then persist the summary") ended exactly where the invocation begins (uf.unleash.md:1023-1039), so deleting the invocation or reverting to a stale persist_unleash_summary-shaped 3-argument call kept the suite green. Pattern for future extraction increments: in the command-layer drift test, pin (1) the invocation's presence within the consuming step's span, (2) the named parameters that define the tool's input contract (review_verdicts, learnings_stored — the fields absent from the superseded signature), (3) absence of the superseded tool name, and (4) the count of removed ceremony markers (strings.Count(command, "CHECKPOINT: Call") == 2), which locks both ceremony reintroduction and over-removal of the explicit review-loop iteration checkpoints. The byte-identical scaffold mirror (drift-enforced) means one command-text assertion covers canonical and embedded copies.
