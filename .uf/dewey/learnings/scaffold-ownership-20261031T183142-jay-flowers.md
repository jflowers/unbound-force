---
tag: scaffold-ownership
author: jay-flowers
category: gotcha
created_at: 2026-10-31T18:31:42Z
identity: scaffold-ownership-20261031T183142-jay-flowers
tier: draft
---

Reclassifying a scaffolded file's ownership and naming the new category in user-facing docs requires aligning every pinning surface with the new taxonomy in the same change, not just the code branch. Beyond isToolOwned and the regression test, the surfaces that get left behind are: (1) the TestIsToolOwned table comment — a newly written "User-owned" label on a project-owned file misleads once the docs define user-owned as a different category (personal templates vs. project-committed config); (2) the docs' category-examples cell — it must enumerate all code-classified members, and uf/sibling-repos.yaml (the third project-owned file behind review-matrix and reviewer-capabilities) is easy to omit when the spec scopes docs to a file pair; (3) the website mirror of the ownership model — unbound-force/website developer.md documents a two-category model and needs its constitutionally-required sync issue filed before PR merge. Verified in opsx/reviewer-capabilities-init-survival (#884): code, regression test, repo docs, and CHANGELOG were aligned, but the test-table comment label, the sibling-repos category membership in docs, and the website's two-category model were left behind.
