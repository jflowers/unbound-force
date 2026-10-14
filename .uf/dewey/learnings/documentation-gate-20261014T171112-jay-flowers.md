---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-14T17:11:12Z
identity: documentation-gate-20261014T171112-jay-flowers
tier: draft
---

An OpenSpec/Speckit Documentation Impact section should record an explicit outcome for every target of the repository's documentation gate — including AGENTS.md and README.md — even when the outcome is "assessed, no update required". Listing only positive obligations (CHANGELOG entry, docs issues, command templates) proves what will change but not that the remaining gate targets were assessed; when the implementation task says "complete the documentation gate (see proposal.md Documentation Impact)", implementers route to the section and skip the unlisted assessments. Negative outcomes cost one line each and make the gate auditable at spec-review time. Verify scope with a repo-wide grep for the affected tool/command names across README.md, docs/, and .opencode/commands/ (plus their internal/scaffold/assets mirrors) to confirm nothing else documents the changed behavior before declaring "no update needed".
