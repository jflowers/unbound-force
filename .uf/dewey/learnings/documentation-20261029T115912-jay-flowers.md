---
tag: documentation
author: jay-flowers
category: pattern
created_at: 2026-10-29T11:59:12Z
identity: documentation-20261029T115912-jay-flowers
tier: draft
---

During Divisor code review, documentation-gate compliance cited in CHANGELOG entries (e.g. "documentation gates filed as in-repo issue #NNN") is a claim, not evidence. Before approving, verify each cited issue exists and is open via `gh issue view <N> --repo <owner>/<repo> --json number,title,state,labels,body`, and run a duplicate check via `gh issue list --label docs --search "<keyword>" --state open`. A dangling or mis-numbered citation means the AGENTS.md documentation gate was not actually satisfied even though the CHANGELOG says it was. Cross-repo citations (e.g. unbound-force/website#NNN per the constitution Cross-Repo Documentation rule) need an explicit --repo override or gh resolves against the current repo and fails misleadingly. In PR #860 (derive-per-run-timeout) both cited issues (#859 in-repo, unbound-force/website#341) verified as OPEN and content-accurate, so the gate held.
