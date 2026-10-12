---
tag: plugin-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-12T16:07:38Z
identity: plugin-architecture-20261012T160738-jay-flowers
tier: draft
---

When extending an existing OpenCode plugin with new tools (like adding checkpoint/get_progress/clear_progress to uf-workflow), the factory function pattern with dependency-injected GitExec and cwd parameters is the established convention. All tool factories should follow this pattern: `export function createXxxTool(exec: GitExec, cwd: string)` returning `tool({...})`. This enables hermetic testing with mock git executors and temp directories. The shared types (like ToolResult, ToolSuccess, ToolFailure) live in `.opencode/lib/` and are re-exported from the plugin's index.ts for consumer convenience.
