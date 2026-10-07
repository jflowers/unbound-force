import type { PluginModule } from "@opencode-ai/plugin"

// Re-export envelope helpers for consumer convenience.
export { failure, success } from "../../lib/uf-workflow-types.js"
export type { ToolFailure, ToolResult, ToolSuccess } from "../../lib/uf-workflow-types.js"

/** UF Workflow plugin — scaffold entry point with empty tool registry. */
const UfWorkflowPlugin = {
  id: "uf-workflow",
  server: async (_input) => {
    // TODO: register workflow tools here
    return { tool: {} }
  },
} satisfies PluginModule

export default UfWorkflowPlugin
