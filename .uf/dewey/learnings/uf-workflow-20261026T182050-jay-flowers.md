---
tag: uf-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-26T18:20:50Z
identity: uf-workflow-20261026T182050-jay-flowers
tier: draft
---

When a uf_delegate_command delegation of a whole command pipeline (/uf.unleash) times out at the 30-minute cap, durable state tells you exactly how far the child got — re-anchor with get_progress (command uf.unleash, key opsx-<change>) + parse_tasks + git status and drive the remaining steps directly in the parent session instead of re-delegating. Verified on update-run-pipeline-plan (2026-10-26): two whole-pipeline delegations timed out (the first hung at the spec-review per-finding question gate — delegated children cannot surface question-tool prompts to the human; the second hung mid-implement after completing only task 1.1); the parent then completed the spec-review gate relay, all 10 implement tasks, phase checkpoints, and code review directly with zero re-work because mark_task_complete, checkpoint, and dispatch artifacts were authoritative. Granularity lesson: command_path delegations of bounded commands work fine; whole-pipeline delegations accumulate interactive gates and long tool chains that exceed the delegation cap. Per-task prompt-only delegations with task_classification remain the prescribed granularity for implement work.
