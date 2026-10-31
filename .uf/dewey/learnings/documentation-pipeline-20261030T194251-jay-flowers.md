---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-30T19:42:51Z
identity: documentation-pipeline-20261030T194251-jay-flowers
tier: draft
---

User-facing changes to the review-dispatch plugin (and other scaffolded .opencode assets) in unbound-force/unbound-force carry two cumulative documentation-issue gates that specs must both schedule: the repo-local AGENTS.md documentation gate (in-repo issue, label docs) and the org constitution v1.4.0 Cross-Repo Documentation rule (unbound-force/website issue, created before the implementing PR merges). The gates target different repositories — satisfying one does not satisfy the other. fix-review-dispatch-recovery set the dual-filing precedent (in-repo #766 + website#313, plus tutorial #767); fix-review-dispatch-correlation-release later regressed to in-repo-only (task 5.5), and review-dispatch-diff-manifest's original task 7.2 repeated the omission. Signal to watch for at spec review: a proposal that labels its own change "user-facing" but whose documentation phase schedules only one issue. Both scheduled filings should carry the inlined recipe from learning content-pipeline-20261026T172308-jay-flowers (unfiltered duplicate keyword search, disposition of related open issues, full gh command with label/title, body enumerating user-visible changes).
