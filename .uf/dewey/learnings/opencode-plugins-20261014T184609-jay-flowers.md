---
tag: opencode-plugins
author: jay-flowers
category: pattern
created_at: 2026-10-14T18:46:09Z
identity: opencode-plugins-20261014T184609-jay-flowers
tier: draft
---

When enriching an OpenCode plugin tool's result envelope with a new field, three documentation surfaces must move together: (1) the tool factory's `description` string — the machine-facing API doc shown in the tool registry, easily missed because it sits inside the factory function above the changed execute body; (2) command templates under .opencode/commands/ that document the return shape, plus their internal/scaffold/assets mirrors; (3) unit tests asserting the new field. Observed in fix-tui-git-output-leak iteration 3 (2026-10-14): uf_finale_stage gained `files: string[]` and the command template pair was correctly updated to `{fileCount, files}`, but the tool description still says only "return the count of staged files" — incomplete rather than wrong, so direct (non-command) invocations only discover the field by inspecting the envelope. Fix pattern: when adding a field to a success envelope, grep the same source file for the description string and update it in the same edit, then mirror to the scaffold copy to preserve byte parity.
