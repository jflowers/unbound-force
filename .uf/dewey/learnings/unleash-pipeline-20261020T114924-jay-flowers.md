---
tag: unleash-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T11:49:24Z
identity: unleash-pipeline-20261020T114924-jay-flowers
tier: draft
---

uf_delegate_command can fail persistently with HOST_MODEL_UNAVAILABLE ("current assistant active variant is unavailable or invalid", retryable: true) — three consecutive retries all failed identically during the unleash-tier-routing fix session on 2026-10-20. The bounded mechanical retry (identical call) does not clear it. Fallback that worked: the native task tool with subagent_type "cobalt-crush-dev" and the same prompt (command context, files-to-read list, task detail, constraints, verification commands, do-not-commit instruction) completed successfully on the first attempt. When uf_delegate_command's host-model resolution is broken, switch to the task tool rather than retrying past the bounded limit; keep the prompt self-contained because the task tool does not add feature-dir context automatically.
