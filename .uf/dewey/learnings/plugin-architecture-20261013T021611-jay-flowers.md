---
tag: plugin-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-13T02:16:11Z
identity: plugin-architecture-20261013T021611-jay-flowers
tier: draft
---

The finale-token-reduction change demonstrates an effective two-plugin architecture for command token reduction: shared primitives (git operations, model normalization, slug sanitization) go in the general-purpose uf-workflow plugin, while command-specific composite tools (startup, stage, PR context, CI poll) go in a dedicated uf-finale plugin. The key architectural pattern is: (1) shared types and functions in `.opencode/lib/uf-workflow-types.ts`, (2) both plugins import from the shared lib and re-export for consumer convenience, (3) all tool factories accept injectable `GitExec` for testability, (4) the `GitExec` type was changed from `(cmd: string, cwd: string) => string` (shell-mode) to `(args: string[], cwd: string) => string` (args-array, no shell) as a security improvement. This pattern reduced the command template from ~1,089 to ~300 lines (~70% token reduction) while preserving all LLM decision points.
