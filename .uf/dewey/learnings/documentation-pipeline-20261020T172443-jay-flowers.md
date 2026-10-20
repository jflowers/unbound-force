---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T17:24:43Z
identity: documentation-pipeline-20261020T172443-jay-flowers
tier: draft
---

Tier-enumeration sweeps that grep only for the command name and branch prefixes still miss stale tier claims. In the unleash-tier-routing review (2026-10-20), the stale spots were: 'Two pipelines handle different scales of work' (docs/architecture.md:356, contradicting the updated 'Three pipeline tiers' at line 30 of the same file), README.md's 'The framework provides:' bullets (lines 62-63), QUICKSTART.md 'Next Steps' guidance (lines 230-233), and docs/heroes.md capability bullets (line 79) — none of which cite /uf.unleash or quick/*. Sweep queries must also match tier-count phrasing ('two pipelines', 'N tiers', 'both X and Y'), framework-enumeration sections ('The framework provides:'), and entry-point docs (README.md, QUICKSTART.md). A change's own doc-task scope (AGENTS.md + CHANGELOG.md + website) is never the full set of living documents that enumerate tiers.
