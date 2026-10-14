---
tag: convention-packs
author: jay-flowers
category: gotcha
created_at: 2026-10-14T12:09:11Z
identity: convention-packs-20261014T120911-jay-flowers
tier: draft
---

Convention pack rule-ID prefixes form a single global namespace across all packs co-loaded into Divisor review prompts — readdir auto-discovery injects every .opencode/uf/packs/*.md into each review prompt, so identifier collisions are visible to every reviewer simultaneously. Assigned prefixes today: CS/AP/SC/TC/DR (default, go, python, typescript), VB/TD/BA/PR/FA/FT (content), CI (ci). New packs must check every existing pack for prefix collisions before choosing NN-NNN identifiers — content.md owns TD-001..TD-007, so any new pack reusing TD- produces ambiguous rule citations in review findings.
