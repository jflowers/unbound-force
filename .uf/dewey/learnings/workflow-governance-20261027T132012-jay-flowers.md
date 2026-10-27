---
tag: workflow-governance
author: jay-flowers
category: gotcha
created_at: 2026-10-27T13:20:12Z
identity: workflow-governance-20261027T132012-jay-flowers
tier: draft
---

Dewey learning files swept into a feature PR should have their created_at provenance checked against the change's workflow window. The AGENTS.md commit-scope rule mandates learnings produced during the active change's workflow, but vaults accumulate uncommitted learnings from earlier changes' retrospectives that get bundled whenever the next change commits .uf/dewey/learnings/. The filename identity timestamp ({tag}-{YYYYMMDDTHHMMSS}-{author}) is the cheapest review-time provenance signal: in unbound-force PR #841 (unleash-interactive-clarify, change created 2026-10-26), five of fifteen committed learning files carry 2026-10-24 timestamps and reference PR #815-era events — a vintage mix that is pragmatically fine to land (the alternative is orphaned vault files) but should be either noted as an intentional backlog sweep in the PR body or split out, because the commit-scope mandate covers only the active change's own workflow learnings.
