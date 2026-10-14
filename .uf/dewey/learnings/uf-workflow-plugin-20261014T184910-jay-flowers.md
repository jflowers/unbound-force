---
tag: uf-workflow-plugin
author: jay-flowers
category: gotcha
created_at: 2026-10-14T18:49:10Z
identity: uf-workflow-plugin-20261014T184910-jay-flowers
tier: draft
---

During the /uf.unleash run on branch opsx/fix-tui-git-output-leak (2026-10-14), the uf-workflow plugin's checkpoint, get_progress, and clear_progress MCP tools failed deterministically with "undefined is not an object (evaluating 'input.replace')" on every call (3x retried). Root cause: the tool schema exposed to the session was an empty object, so argument JSON never reached the plugin's createCheckpointTool handler, which expects {command, step, data?, key?} string params (.opencode/plugins/uf-workflow/index.ts createCheckpointTool, ~line 228). Workaround that kept the pipeline compliant: the uf.unleash template itself declares filesystem markers authoritative for resumability, so progress was tracked via TodoWrite plus on-disk state (tasks.md checkboxes, .uf/artifacts/dispatch/*.json artifacts) and the broken tools were never called. Agents hitting this error should skip these tools rather than retry; the error is a schema-plumbing defect, not transient.
