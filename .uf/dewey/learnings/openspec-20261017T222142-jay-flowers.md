---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-17T22:21:42Z
identity: openspec-20261017T222142-jay-flowers
tier: draft
---

When a spec scenario embeds an executable validation command (e.g., an rg ban-list regex), the command must be mechanically derived from the requirement's canonical enumeration, not hand-transcribed. In the command-prose-pilot OpenSpec change, the command-prose-standard spec's ban-list scenario regex omitted `terminate` while the requirement text, design D2, the sibling run-pipeline-plan spec, and tasks.md all listed five tokens — running the scenario as written would false-pass on `terminate`. Before approving a spec, diff every embedded validation command against the token list of the requirement it verifies.
