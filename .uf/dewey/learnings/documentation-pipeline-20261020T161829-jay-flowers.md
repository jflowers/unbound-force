---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T16:18:29Z
identity: documentation-pipeline-20261020T161829-jay-flowers
tier: draft
---

Documentation sweeps for command-behavior changes must grep the command's accepted branch prefixes and tier-model enumerations, not just step numbers and the command name. In unleash-tier-routing round 3, the Step 8→Step 6 audit (tasks 9.3/10.4) had fixed uf.unleash.md and AGENTS.md, and the website's common-workflows page was rewritten, yet docs/usage.md:137 and docs/architecture.md:434 still taught "Works with both Speckit (`NNN-*` branches) and OpenSpec (`opsx/*` branches)" and architecture.md:30 still counted "Two pipeline tiers" after the quick tier landed — and tracking issue #772's Documentation-impact list (AGENTS.md, CHANGELOG.md, website) left those pages untracked. Sweep pattern: for each behavior-changing command, grep the command name AND every accepted branch prefix across docs/, QUICKSTART.md, README.md, and AGENTS.md, then verify the tracking issue's Documentation-impact list covers every hit. Tier enumerations ("works with both X and Y", "N tiers") go stale exactly like step cross-references but escape step-numbered audits.
