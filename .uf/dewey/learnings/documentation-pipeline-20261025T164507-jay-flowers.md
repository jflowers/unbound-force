---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-25T16:45:07Z
identity: documentation-pipeline-20261025T164507-jay-flowers
tier: draft
---

Unbound Force docs companion issues must carry the `docs` label at creation time. The Curator's website-issue and duplicate-issue checks search `gh issue list --label docs --search <keyword> --state open`, so an unlabeled companion issue evades every label-filtered search: it reads as a missing documentation issue (false HIGH) or invites duplicate filing. Observed on PR 815 (unleash-build-test-fix-loop): companion issue unbound-force/unbound-force#819 was filed without the label; the iteration-1 curator flagged it, and the label was verified present at iteration 2. When filing a docs issue via `gh issue create`, always pass `--label "docs"`; when the companion issue is filed by another agent or by hand, verify the label — not just the issue's existence — before treating the AGENTS.md documentation gate as satisfied.
