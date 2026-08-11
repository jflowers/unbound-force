---
tag: specify-cli
author: jay-flowers
category: reference
created_at: 2026-08-11T17:40:19Z
identity: specify-cli-20260811T174019-jay-flowers
tier: draft
---

The specify-cli (Speckit) changed its CLI contract significantly around version 0.9.4+. Key changes: (1) bare `specify init` now requires --here or a project name argument, (2) --ai flag removed, replaced by --integration, (3) non-interactive sessions default to copilot integration not opencode, (4) --offline flag uses bundled wheel assets instead of downloading from GitHub Releases. The correct invocation for uf init is: `specify init --here --integration opencode --offline`. The simpleTools extraArgs mechanism in scaffold.go handles this via []string{"--here", "--integration", "opencode", "--offline"}.
