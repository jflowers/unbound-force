---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T19:59:00Z
identity: documentation-pipeline-20261020T195900-jay-flowers
tier: draft
---

When a change adds a behavioral safety guarantee that bounds a selection mechanism, mirror the guarantee in every documentation layer where engineers make that selection — not only in agent-facing skills/commands and the public website. Sweep rule: when a spec adds a constraint that bounds a selection criterion (e.g., risk floors on workflow-tier routing), grep every doc that presents that selection criterion (workflow tables, decision diagrams, tier rows) and add the constraint there in the same change. Observed on opsx/unleash-tier-routing (PR #784): the risk floors (security-sensitive, auth, data-loss, public-API-breaking never route quick) landed in tier-routing SKILL.md, uf.unleash.md, and website docs, but the docs/usage.md workflow table and the AGENTS.md Quick tier row added in the same diff omit them.
