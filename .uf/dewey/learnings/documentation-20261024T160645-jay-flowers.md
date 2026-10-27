---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-24T16:06:45Z
identity: documentation-20261024T160645-jay-flowers
tier: draft
---

In the unbound-force meta repo, a complete CHANGELOG entry plus in-command documentation does not satisfy the documentation gate for user-facing workflow changes. The org constitution's Cross-Repo Documentation rule requires a tracking issue in unbound-force/website before the implementing PR merges, and repo practice also files a companion docs issue against unbound-force/unbound-force (e.g., tier routing #772 + website #314; delegation contract #791 + website #317). Changes to .opencode/commands/*.md and their internal/scaffold/assets/ mirrors are user-facing (scaffolded into consumer projects via uf init) and trigger the requirement. Review signal: a PR body with no issue references and a CHANGELOG entry with no "Fixes: #N" citation means the docs issue was most likely never filed — verify with gh issue list (label docs + text search) in both repos before concluding it exists.
