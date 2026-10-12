---
tag: plugin-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-12T17:31:59Z
identity: plugin-architecture-20261012T173159-jay-flowers
tier: draft
---

When extending an existing OpenCode plugin with new tools, the factory function pattern with dependency-injected GitExec and cwd parameters is the established convention in the uf-workflow plugin. All tool factories follow `export function createXxxTool(exec: GitExec, cwd: string)` returning `tool({...})`. This enables hermetic testing with mock git executors and temp directories. The shared result envelope types (ToolResult, ToolSuccess, ToolFailure) live in `.opencode/lib/uf-workflow-types.ts` and are re-exported from the plugin's index.ts. New tools should follow this exact pattern for consistency.
