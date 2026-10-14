---
tag: review-council
author: jay-flowers
category: pattern
created_at: 2026-10-14T18:49:12Z
identity: review-council-20261014T184912-jay-flowers
tier: draft
---

In local (no-PR, no-posting) review-council runs, findings whose remediation lives outside the repository — e.g. filing a constitution-mandated tracking issue in another repo (unbound-force/website#306) or commenting on a docs issue (#710) — cannot be cleared by the review agent or by local edits, so the council returns REQUEST CHANGES even when the code itself passes clean. Convergent pattern observed on fix-tui-git-output-leak (2026-10-14, iterations 1→2→3: 6 findings → 3 → APPROVE WITH ADVISORIES): the parent executes the GitHub actions exactly as each finding's remediation text specifies, records the resulting URLs/issue numbers in-repo (proposal.md Documentation Impact + CHANGELOG.md entry), then re-runs one confirmation iteration; all three findings then verified cleared via read-only `gh issue view`. Executing constitution-mandated, review-recommended GitHub actions directly from the parent session is low-risk and unblocks the otherwise-deadlocked fix loop.
