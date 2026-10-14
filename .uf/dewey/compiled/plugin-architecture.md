---
tier: draft
compiled_at: 2026-10-14T11:07:28Z
compiled_by: enmaas/rits/zai-org/glm-5-3
sources:
  - plugin-architecture-20261012T160738-jay-flowers
  - plugin-architecture-20261012T173159-jay-flowers
  - plugin-architecture-20261013T021611-jay-flowers
topic: plugin-architecture
---

## Current State

- Tool factories in OpenCode plugins follow the established convention `export function createXxxTool(exec: GitExec, cwd: string)` returning `tool({...})`. Dependency-injected `GitExec` and `cwd` parameters enable hermetic testing with mock git executors and temp directories.
- Shared result envelope types (`ToolResult`, `ToolSuccess`, `ToolFailure`) live in `.opencode/lib/uf-workflow-types.ts` and are re-exported from each plugin's `index.ts` for consumer convenience.
- The `GitExec` type is args-array — `(args: string[], cwd: string) => string` — executing without a shell. This is a security improvement over the earlier shell-mode signature `(cmd: string, cwd: string) => string`.
- The two-plugin architecture for command token reduction places shared primitives (git operations, model normalization, slug sanitization) in the general-purpose uf-workflow plugin, and command-specific composite tools (startup, stage, PR context, CI poll) in a dedicated command plugin (uf-finale).
- This architecture reduced the finale command template from ~1,089 to ~300 lines (~70% token reduction) while preserving all LLM decision points.
