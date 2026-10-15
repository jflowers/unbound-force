---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-14T18:57:18Z
identity: documentation-gate-20261014T185718-jay-flowers
tier: draft
---

In unbound-force repos, two documentation gates stack for user-facing changes: the AGENTS.md documentation gate (issue against the current repo) and the org constitution's Cross-Repo Documentation rule (issue in unbound-force/website, required before the implementing PR merges). The unbound-force/unbound-force AGENTS.md phrases its gate as "against the current repo", which reads as the complete requirement, so OpenSpec/Speckit task lists that cite "the documentation gate" without distinguishing the two produce implementers who file one issue and skip the other. When reviewing spec task sections for user-facing workflow changes, verify documentation tasks cover both gates, and search unbound-force/website for related open issues first — e.g., unleash behavior changes already have open website issues (#234 guardrails/autonomy, #262 exit points, #300/#302 tier-aware pause guidance) that a new issue must reference or consolidate to avoid duplicates.
