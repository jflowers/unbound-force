---
tag: issue-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-15T13:59:17Z
identity: issue-verification-20261015T135917-jay-flowers
tier: draft
---

Verify referenced issue numbers with `gh issue view <N> --repo <repo> --json state` before flagging them as stale or closed: `gh issue list` paginates (roughly 30 newest results per page) and older open issues fall off the first page. In the 2026-10-15 unleash-deterministic-tools review, unbound-force/website issues #234 and #262 were absent from `gh issue list --state open` output (list ended at #277) but were confirmed OPEN via `gh issue view`; trusting the list alone would have produced a false "stale reference" finding against a correct spec.
