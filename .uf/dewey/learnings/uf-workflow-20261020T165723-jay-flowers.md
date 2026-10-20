---
tag: uf-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-20T16:57:23Z
identity: uf-workflow-20261020T165723-jay-flowers
tier: draft
---

uf_delegate_command fails with HOST_MODEL_UNAVAILABLE when the host session's assistant model variant cannot be resolved by agent-executor's resolveHostModel (.opencode/lib/agent-executor.ts:234-263) — observed for every attempt in one 2026-10-20 session while the same models worked fine for review dispatch. The tool has no model-override parameter, so the failure is not locally repairable. Fallback that preserves /uf.unleash protocol semantics: delegate via the task tool with subagent_type cobalt-crush-dev and a self-contained prompt (task text + context + constraints + targeted verification + report requirements), then perform the command's bookkeeping manually — mark_task_complete (idempotent single-byte flip) and checkpoint after success; on worker failure emit format_unleash_exit implement-worker-failed {phase, failed_task, error} verbatim. The worktree path also still works without uf_delegate_command: forge_worktree_create → task-tool worker in the worktree → forge_worktree_merge (cherry-pick) → scan_conflict_markers → forge_worktree_cleanup.
