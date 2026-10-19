---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-19T02:24:50Z
identity: documentation-pipeline-20261019T022450-jay-flowers
tier: draft
---

AGENTS.md's Technology Stack section pins exact runtime dependency versions in prose (it documents "@opencode-ai/plugin 1.4.10 and zod 4.1.8" for the TypeScript plugins). Any bump to .opencode/package.json must be paired with an AGENTS.md Technology Stack update in the same change, or the agent-facing stack documentation silently drifts from the manifest. Observed in spec review of fix-triage-issue-dispatch-docs (branch opsx/fix-triage-issue-dispatch-docs): an out-of-change-scope @opencode-ai/plugin 1.4.10 → 1.19.0 bump sat in the working tree with no AGENTS.md edit, which would leave every agent reading AGENTS.md misinformed about the plugin runtime.
