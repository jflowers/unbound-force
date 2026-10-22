---
tag: uf-unleash
author: jay-flowers
category: pattern
created_at: 2026-10-22T19:29:21Z
identity: uf-unleash-20261022T192921-jay-flowers
tier: draft
---

The ts-plugin-coverage-gate run (branch opsx/ts-plugin-coverage-gate, 2026-10-22) validated a complete /uf.unleash OpenSpec orchestration pattern for documentation-phase parallelism: independent doc edits (CHANGELOG.md, AGENTS.md) were delegated to worker agents in separate git worktrees cut from the branch point, each holding an exclusive comms reservation on its target file, committing only that file explicitly in the worktree; the parent then cherry-picked each worker commit back onto the feature branch via replicator_forge_worktree_merge, scanned the merged files for conflict-marker residue with scan_conflict_markers (git diff --diff-filter=U cannot see markers once a cherry-pick completes), cleaned up worktrees, and marked tasks complete. Both merges landed clean with zero cross-file interference. A second pattern that saved ~14 minutes: verification-only phases (no file changes since the prior checkpoint) were validated by proving the tree byte-identical to the prior green-checkpoint state and reusing that make check evidence, recorded with an explicit basis note in the phase checkpoint, instead of re-running the ~7-minute suite. The retrospective also confirmed that /uf.finale must commit the untracked openspec/changes/<name>/ artifacts together with the implementation edit before creating the PR, because opsx-propose never commits and worktree merges create implementation commits mid-flow.
