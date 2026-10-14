---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-14T18:13:18Z
identity: documentation-gate-20261014T181318-jay-flowers
tier: draft
---

OpenSpec task checkboxes that cover cross-repo or issue-tracker deliverables (filing the constitution-mandated unbound-force/website tracking issue, or updating a referenced docs issue's scope) leave no evidence in the repository diff, so a checked box is unverifiable by diff review and can mask unfinished work. Before checking such a task complete, execute the filing/update AND record the resulting issue number or comment permalink in the change artifacts (proposal Documentation Impact, tasks.md, or the CHANGELOG reference) so reviewers can trace it. Reviewers must verify the external state directly: `gh issue list` against the target repo (all states, keyword search) for the tracking issue, and `gh issue view --json body,comments,updatedAt` for scope updates — updatedAt equal to the creation timestamp plus zero comments proves no update was ever made. Observed in fix-tui-git-output-leak (2026-10-14): task 3.4 was checked [x], but the website tracking issue had never been filed (newest website issue #305 predated the change's implementation) and docs issue #710 had never been updated (updatedAt == creation, comments == [], body lacking envelope-only output / files array / silent ci_poll).
