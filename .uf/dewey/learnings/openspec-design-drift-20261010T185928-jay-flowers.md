---
tag: openspec-design-drift
author: jay-flowers
category: pattern
created_at: 2026-10-10T18:59:28Z
identity: openspec-design-drift-20261010T185928-jay-flowers
tier: draft
---

The fetch-pr-review-context PR (October 2026) demonstrates that when design decisions evolve during implementation, the spec and design.md are typically updated first, but tasks.md and proposal.md are often missed. The Guard persona should check ALL spec artifacts (not just spec.md and design.md) for stale references when a design decision changes. A systematic approach: after any D-number decision evolves, grep all files under the openspec/changes/ directory for the old terminology and update them.
