---
tag: dry-refactoring
author: jay-flowers
category: pattern
created_at: 2026-10-12T23:56:18Z
identity: dry-refactoring-20261012T235618-jay-flowers
tier: draft
---

When extracting shared functions from duplicate implementations across TypeScript MCP plugins, ensure tool wrappers actually delegate to the shared function rather than keeping the algorithm inlined. In the finale-token-reduction change, normalizeModelName was extracted to lib/uf-workflow-types.ts and used by uf-finale's commit_context tool, but the createNormalizeModelNameTool in uf-workflow kept the full 6-step algorithm inlined instead of calling the shared function. The architect reviewer caught this in iteration 2. The fix was simple: replace the 50-line inlined algorithm with a 3-line delegation to normalizeModelName(raw) plus appropriate warning messages. This pattern — extract to shared lib, then update ALL consumers including tool wrappers — should be a checklist item for DRY refactoring.
