---
tag: convention-packs
author: jay-flowers
category: gotcha
created_at: 2026-10-14T12:09:09Z
identity: convention-packs-20261014T120909-jay-flowers
tier: draft
---

Adding a file to .opencode/uf/packs/ in the unbound-force meta repo triggers two directory-walking test gates, not one: (1) TestCanonicalSources_AreEmbedded (internal/scaffold/scaffold_test.go) — repo-local, non-embedded files need a knownNonEmbeddedFiles exclusion entry; (2) TestValidateConventionPack_AllPacksValid (internal/schemas/packvalidator_test.go) — every non-custom pack not on the name-based skip list (severity.md, content.md, ci.md) must carry pack_id/language/version frontmatter and the six coding H2 sections (Coding Style, Architectural Patterns, Security Checks, Testing Conventions, Documentation Requirements, Custom Rules). Governance-style packs must be added to the validator skip list with a rationale comment, following the severity/content/ci precedent (see ci-convention-pack task 3.2). Plans that add a pack MUST cover both tests or make test fails.
