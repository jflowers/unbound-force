---
tag: opsxrouter-pattern-codification-2026-10-19-swarm
author: jay-flowers
category: pattern
created_at: 2026-10-19T21:20:35Z
identity: opsxrouter-pattern-codification-2026-10-19-swarm-20261019T212035-jay-flowers
tier: draft
---

When the OpenSpec change directory is still untracked (spec artifacts committed only later at PR time), swarm workers in fresh git worktrees cannot read the spec from git history — a worktree checks out tracked commits only. The pattern that worked for router-pattern-codification: create per-task worktrees, but pass the pinned design content verbatim in the spawn shared_context (the design.md "Exact content" blocks for the pack section and skill edits), so each worker is self-contained. Workers commit on swarm/* branches inside their worktrees; the coordinator cherry-picks each branch back onto the opsx/* feature branch sequentially, then runs scan_conflict_markers over the touched files (it catches markers git diff --diff-filter=U misses after the merge completes), then cleans up worktrees and releases comms reservations. Three parallel tasks (pack, skill, CHANGELOG) merged with zero conflicts this way.
