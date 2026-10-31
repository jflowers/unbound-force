---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-31T18:31:44Z
identity: documentation-gate-20261031T183144-jay-flowers
tier: draft
---

User-facing scaffold changes in unbound-force/unbound-force (e.g., isToolOwned ownership flips that alter uf init re-run dispositions) require three documentation surfaces before the review council runs: (1) in-PR updates to docs/architecture.md, docs/configuration.md, and CHANGELOG.md; (2) a docs-labeled tracking issue in the current repo covering follow-up work such as release-notes wording for the disposition change (Updated -> Skipped) and the canonical-updates trade-off; and (3) a cross-repo issue in unbound-force/website per the constitution's Cross-Repo Documentation rule, which can also carry the tutorial disposition when the change makes a workflow newly durable. Precedent: the reviewer-capabilities-init-survival change filed unbound-force/unbound-force#886 and unbound-force/website#350 (docs + tutorial labels) before review, with website#350 tracking the three-file custom-reviewer registration tutorial (.opencode/agents/divisor-<name>.md, .uf/review-matrix.yaml, .uf/reviewer-capabilities.yaml).
