---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-27T15:48:19Z
identity: documentation-gate-20261027T154819-jay-flowers
tier: draft
---

The unbound-force documentation gate for user-facing changes is two-target, not one: (a) a docs-labeled issue in the current repo (AGENTS.md documentation gate rule) and (b) a GitHub issue in unbound-force/website (org constitution v1.4.0 Development Workflow Cross-Repo Documentation rule). tasks.md files should carry a single gate-assessment task covering both targets with search-first consolidation — the established wording pattern is: file documentation issues against the current repo AND unbound-force/website, search for existing open issues first and extend them instead of filing duplicates, cover CHANGELOG.md, README.md, and AGENTS.md impact, and mark tasks complete only once both issues exist. Precedents: unleash-deterministic-tools task 8.2, unleash-interactive-clarify task 6.2, clarification-marker-superset task 5.2, delegation-skill-enforcement. Exemption from the website target requires a recorded rationale (seam-verification precedent: internal-only change, users interact through the host CLI). A task covering only the current-repo target with no recorded exemption rationale is a convention gap at MEDIUM severity in spec review.
