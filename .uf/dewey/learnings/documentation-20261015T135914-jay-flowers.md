---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-15T13:59:14Z
identity: documentation-20261015T135914-jay-flowers
tier: draft
---

Spec docs-gate tasks must name the target repo explicitly for every required issue: the org constitution v1.4.0 Cross-Repo Documentation rule (.specify/memory/constitution.md:290-296) requires user-facing workflow changes to file a GitHub issue in unbound-force/website before the implementing PR merges, while the repo AGENTS.md documentation gate requires filing against the current repo. A docs task naming neither target lets either gate be silently skipped — following either alone misses the other. Both gates stack: file the current-repo docs issue (docs label) AND the website issue (conventionally unlabeled), recording both numbers in-repo at filing time.
