---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:22:30Z
identity: content-pipeline-20261030T212230-jay-flowers
tier: draft
---

A Curator reviewer running inside a dispatched review council cannot file the docs/blog/tutorial issues it recommends: `gh issue create` carries permission "ask", and a parented child session cannot answer an ask — the exact wedge mode the sibling-evidence change exists to prevent. Working pattern (verified 2026-10-30 on the sibling-evidence-agent-guidance council run): execute the read-only duplicate searches yourself (`gh issue list` is allowed — run them UNFILTERED by keyword, not just --label docs, per learning content-pipeline-20261026T172308-jay-flowers), then emit each missing issue as a finding whose recommendation carries the complete filing recipe — the already-executed search commands and results, the full `gh issue create` command with --repo/--title/--label, and the body enumerating user-visible changes and affected pages — so the parent session or developer can file verbatim without re-deriving scope.
