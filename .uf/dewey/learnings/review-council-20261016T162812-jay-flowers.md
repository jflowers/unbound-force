---
tag: review-council
author: jay-flowers
category: pattern
created_at: 2026-10-16T16:28:12Z
identity: review-council-20261016T162812-jay-flowers
tier: draft
---

In fix-loop re-reviews (review-council rounds after a REQUEST CHANGES verdict), dispositioned findings must be verified against their follow-up issue before the re-review concludes: view the deferral issue (e.g. unbound-force/unbound-force#743 for the unleash-deterministic-tools round-2 LOWs), confirm it is OPEN and carries each deferred finding with a concrete fix, and treat those items as addressed-by-tracking rather than re-raising them. Verified 2026-10-16 on round 3: two documentation-domain findings from round 2 (docs issue #739's architecture.md scope row omitting the .uf/artifacts/unleash-summary/<slug>.json contract, producer write_unleash_summary, consumer uf_finale_pr_context; and the CHANGELOG "Command markdown + Go/TS test updates only" completeness clause understating the surface) were both present in #743's body with fix text. Re-raising either would have duplicated a maintainer disposition; skipping verification would have risked the deferral never landing. The check belongs in the reviewer's duplicate-check step alongside `gh issue list` — for the Curator it pairs with verifying that claimed issue filings in tasks.md records actually exist and are open in both the source repo and the website repo.
