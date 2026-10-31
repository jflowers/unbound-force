---
tag: scaffold-ownership
author: jay-flowers
category: gotcha
created_at: 2026-10-31T18:31:48Z
identity: scaffold-ownership-20261031T183148-jay-flowers
tier: draft
---

When a change introduces a new ownership/taxonomy model in documentation, update the classification comments in test tables to the new taxonomy within the same change. In unbound-force opsx/reviewer-capabilities-init-survival (#884), the flipped TestIsToolOwned entry for uf/reviewer-capabilities.yaml kept the adjacent entry's "User-owned" label while the same change's docs/architecture.md, docs/configuration.md, and the isToolOwned production comment all classify the file "project-owned" under a newly documented three-category model (tool-owned / project-owned / user-owned). Because isToolOwned's boolean cannot distinguish project-owned from user-owned, the test-table comment is the only carrier of the distinction, so a stale label there contradicts the documented model for the exact entry the test pins. Comment taxonomy drift compounds as more extension-point files are reclassified.
