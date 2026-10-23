---
tag: seam-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-23T18:29:09Z
identity: seam-verification-20261023T182909-jay-flowers
tier: draft
---

A seam-verification task scoped by assertion surface can be completed faithfully while leaving DE-007's documented-output-shape layer unverified — task completion and seam verification diverge. Verified on rebase-upstream-before-push (unbound-force/unbound-force PR #812, 2026-10-23): tasks.md task 3.2 said 'update tool-enumeration or registration-surface tests that assert the uf-finale tool list'; the increment completed the 9-tool registration lists and marked the task [x], yet the golden-output-shape census stayed at 8 sites and no golden test pinned uf_finale_base_state's documented envelope at uf.finale.md:132. The gap survived because the task scope was derived from the tool-list assertion surface rather than from DE-007's three named layers. Recipe: when a change adds a documented tool-call site to a command file, derive the tasks.md seam-verification task from the DE-007 layer list — name the concrete suite implementing each layer for the affected plugin (registration-surface tests; golden-output-shape for the documented output shape; round-trip audits, or an explicit N/A for read-only tools) — so a completed checkbox cannot mask an unverified layer.
