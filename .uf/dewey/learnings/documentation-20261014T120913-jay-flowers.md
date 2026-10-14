---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-14T12:09:13Z
identity: documentation-20261014T120913-jay-flowers
tier: draft
---

Spec docs-gate triage: an exemption claim of "repo-local, nothing user-facing propagates" must be tested against every propagation channel, not just scaffolding. In the unbound-force org, a change is user-facing when it (a) adds files under .opencode/skills/ or .opencode/uf/packs/ — these alter agent and review-council behavior repo-wide even without uf init propagation; (b) amends the org constitution — the website maintains a constitution page, prior amendments (Principle V) generated unbound-force/website issues (#142, #254 remain open), and hero repos inherit alignment obligations within one release cycle. "Does not propagate via uf init" is not equivalent to "not user-facing." Verification recipe: gh issue list --repo unbound-force/website --search constitution, plus README.md's Constitution section, which enumerates principles and drifts when principles are added.
