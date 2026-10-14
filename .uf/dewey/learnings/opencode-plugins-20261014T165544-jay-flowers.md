---
tag: opencode-plugins
author: jay-flowers
category: gotcha
created_at: 2026-10-14T16:55:44Z
identity: opencode-plugins-20261014T165544-jay-flowers
tier: draft
---

OpenCode plugin tool handlers execute inside the opencode server process, which shares its terminal with the TUI's alternate-screen renderer. Any console.log/console.error inside a tool handler interleaves with TUI rendering and corrupts the display. All handler output must flow through the structured JSON tool-result envelope (success data in the result object, errors via the failure envelope), and subprocess stdio must be piped and captured, never inherited. Verified in unbound-force: uf-workflow had 18 and uf-finale 32 such calls (duplicated in the embedded internal/scaffold/assets tree); review-dispatch and invoke-agent were already clean.
