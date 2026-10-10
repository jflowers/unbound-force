---
tag: openspec-design-drift
author: jay-flowers
category: gotcha
created_at: 2026-10-10T17:28:37Z
identity: openspec-design-drift-20261010T172837-jay-flowers
tier: draft
---

When implementing OpenSpec changes that specify BunShell template literals for CLI execution (design decision D2), if the implementation evolves to use Bun.spawn with explicit argument arrays instead (for better command injection safety), ALL spec artifacts must be updated to reflect this evolution — not just the primary spec file, but also design.md, tasks.md, and proposal.md. During the fetch-pr-review-context implementation (October 2026), the divisor-guard agent caught stale BunShell references in tasks.md and proposal.md as MEDIUM intent-drift findings, even after design.md and the spec were already updated. The lesson: design decision evolution during implementation is normal and expected, but the update must propagate to every artifact that references the decision, not just the obvious ones.
