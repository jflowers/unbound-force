---
tag: filesystem-write-safety
author: jay-flowers
category: pattern
created_at: 2026-10-16T19:11:45Z
identity: filesystem-write-safety-20261016T191145-jay-flowers
tier: draft
---

When a change introduces multiple tools that all perform filesystem writes (write_unleash_summary, resolve_clarification, mark_task_complete), verify that each tool applies the project's established write-safety pattern consistently: (1) resolveRepoRelative traversal guard before any I/O, (2) lstat-based symlink refusal on both the target file and its parent directory (the persist_unleash_summary dual-check pattern), and (3) restrictive file modes (0o600 file, 0o700 directory). In the unleash-deterministic-tools change, write_unleash_summary applies all three layers, but resolve_clarification and mark_task_complete delegate writes through injected writeText dependencies that bypass the symlink and mode checks — acceptable because they write to spec.md and tasks.md (existing user-owned files in the feature directory, not tool-created artifacts in .uf/), but the distinction should be documented so future tools writing to .uf/ paths follow the full pattern.
