---
tag: sandbox
author: jay-flowers
category: gotcha
created_at: 2026-05-10T17:33:10Z
identity: sandbox-20260510T173310-jay-flowers
tier: draft
---

DevPod v0.6.x has a known Bun runtime bug where the VS Code IDE tunnel crashes after successful workspace creation, producing a noisy "The socket connection was closed unexpectedly" error on stderr with a Bun stack trace. The workspace itself creates and runs fine — the error is purely in DevPod's WebSocket/tunnel teardown code. The correct approach to handle this is status-based suppression: when devpod up returns non-zero, check "devpod status <ws> --output json" to see if the workspace is actually Running. If it is, the error was a non-fatal tunnel issue and can be suppressed with a friendly message. If the workspace is not Running, report the original error. This avoids brittle string-matching on DevPod's internal error messages.
