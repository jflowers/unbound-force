---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-19T12:20:49Z
identity: documentation-gate-20261019T122049-jay-flowers
tier: draft
---

When a spec change alters a textual syntax or convention (marker grammar, config format, flag name), derive the documentation-assessment task's surface list from a repo-wide grep of the syntax string, not from the pages named in the tracking issue. In the clarification-marker-superset review, task 5.2 enumerated AGENTS.md, the .specify templates, and the docs/ pages from issue #739 — while .opencode/commands/speckit.specify.md held nine marker-syntax references including the only literal bracketed teaching outside the templates, and the enumerated docs pages held zero marker mentions. The instruction-dense teaching surfaces for a convention often live in command/skill files the tracking issue never mentions. Same discipline applies to declarations: verify count labels ("ten packages refreshed") against their own enumerated lists, not just the names against the source — the proposal's lock-derived enumeration was name-complete but its count word matched neither the nine names enumerated nor any reading of the lock diff (nine transitive refreshes; ten only when the direct dependency is wrongly counted as transitive).
