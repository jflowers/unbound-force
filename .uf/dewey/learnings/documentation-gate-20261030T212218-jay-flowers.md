---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:22:18Z
identity: documentation-gate-20261030T212218-jay-flowers
tier: draft
---

Guidance-flavored changes still trip the user-facing documentation gates when they touch canonical convention packs, scaffold behavior, or plugin tool envelopes — the gates bind to deployment surfaces, not to the change's flavor. quick/sibling-evidence-agent-guidance updated AGENTS.md but initially left two obligations unmet at review time: no CHANGELOG.md Unreleased entry (repo convention: "All notable changes to this project are documented in this file", format `- <change-name>: <summary>` with Spec:/Docs: citations) and no unbound-force/website documentation issue (constitution Cross-Repo Documentation rule: required before the implementing PR merges for changes affecting workflows, CLI/scaffold behavior, or hero capabilities). Assess the documentation gate against every surface the change touches — canonical pack rules, scaffold assets (uf init output), tool output contracts — not just the repo's own AGENTS.md; quick-tier routing does not exempt these surfaces.
