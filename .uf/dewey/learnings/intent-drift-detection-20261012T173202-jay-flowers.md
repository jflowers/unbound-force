---
tag: intent-drift-detection
author: jay-flowers
category: gotcha
created_at: 2026-10-12T17:32:02Z
identity: intent-drift-detection-20261012T173202-jay-flowers
tier: draft
---

When a spec defines PR-scoped state keying (e.g., `key: "pr-<N>"`) for a specific command, the command file's checkpoint instructions must include the `key` parameter in every checkpoint call. It's easy to update the `command` parameter consistently while forgetting the `key` parameter, especially when most commands use the default branch-based keying. The spec scenario should be used as a template for the command file's checkpoint instructions.
