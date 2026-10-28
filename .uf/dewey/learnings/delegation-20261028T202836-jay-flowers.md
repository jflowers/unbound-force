---
tag: delegation
author: jay-flowers
category: gotcha
created_at: 2026-10-28T20:28:36Z
identity: delegation-20261028T202836-jay-flowers
tier: draft
---

In delegated child sessions the read tool hangs indefinitely on paths outside the workspace root — it does not error, it stalls the entire run. Verified on port-uf-rebase-pr (2026-10-28): the source command lived at ~/.config/opencode/commands/resolve-branch-conflict.md, unreachable from the delegated child, so the orchestrator staged a byte-identical copy at .local-sources/resolve-branch-conflict.md (git-excluded via .git/info/exclude) and instructed the child to read only the staged copy. The change's task 4.3 then verified the staging left no residue forensically: no tracked files, no blobs on any ref, no commits, and no file-level references to .local-sources/ in any shipped artifact. When delegating work that consumes material outside the workspace, stage that material inside the repo under a git-excluded path before spawning the child, and verify the exclusion leaves no repository residue before the PR.
