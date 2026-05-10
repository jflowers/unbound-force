---
tag: sandbox
author: jay-flowers
category: gotcha
created_at: 2026-05-10T17:33:04Z
identity: sandbox-20260510T173304-jay-flowers
tier: draft
---

DevPod snapshots the devcontainer.json file at workspace creation time and never re-reads it on subsequent starts. This means changes to the devcontainer template (like adding postStartCommand) do not take effect for existing workspaces. The solution is a two-pronged approach: (1) include postStartCommand in the template for new workspaces, and (2) add an SSH fallback in Start() and Create() that manually starts the server via "devpod ssh <ws> -- sh -c 'nohup opencode server ...'" when the health check times out. The SSH fallback handles both old workspaces and cases where postStartCommand failed silently.
