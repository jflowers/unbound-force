---
tag: scaffold-parity
author: jay-flowers
category: pattern
created_at: 2026-10-19T16:42:11Z
identity: scaffold-parity-20261019T164211-jay-flowers
tier: draft
---

Changes to live OpenCode plugin files (.opencode/plugins/*, .opencode/lib/*, .opencode/uf/schemas/*) have embedded twins under internal/scaffold/assets/ that re-publish them to every scaffolded repo. The active advisor-host-model-fallback spec carries a MODIFIED "Scaffold Asset Parity" requirement ("The scaffold copy of review-dispatch/index.ts MUST be identical to the live plugin"), and AGENTS.md testing conventions require drift tests proving embedded tool-owned assets match canonical sources. Any change touching a live plugin file MUST add a lockstep scaffold-sync task and name the twin paths in the proposal's Impact section; otherwise CI drift tests fail and sibling repos inherit the unfixed behavior.
