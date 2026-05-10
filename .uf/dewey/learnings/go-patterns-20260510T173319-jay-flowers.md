---
tag: go-patterns
author: jay-flowers
category: pattern
created_at: 2026-05-10T17:33:19Z
identity: go-patterns-20260510T173319-jay-flowers
tier: draft
---

When a subprocess returns a non-zero exit code but may have partially succeeded, use status-based verification rather than parsing stderr output. For example, when devpod up fails but the workspace may have been created, check "devpod status" to verify the outcome. This pattern is more reliable than string-matching on error messages because error messages are unstable across versions and locales. The isWorkspaceRunning() helper encapsulates this pattern: call the status command, parse the JSON output, check the state field. If the status command itself fails, treat that as a real failure and propagate the original error.
