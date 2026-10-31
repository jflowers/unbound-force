---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-31T00:35:30Z
identity: documentation-gate-20261031T003530-jay-flowers
tier: draft
---

Divisor-curator running as a dispatched review child (review-council code mode) must not file issues: the invocation's Prohibitions section overrides the agent definition's `gh issue create` step, so the documentation-gate check degrades to read-only verification — confirm the change's referenced docs issues exist and are open via `gh issue view <N> --repo <owner>/<repo> --json number,title,state,labels` — and submit any missing-issue gap as a structured finding carrying the full `gh issue create` command text for the parent workflow to file. Verified during the forward-aggregate-correlation-id council review (2026-10-30): repo-local docs issue unbound-force/unbound-force#879 (OPEN, docs label) and website sync issue unbound-force/website#348 (OPEN) confirmed by ID, satisfying the AGENTS.md docs-issue gate and the org constitution's Cross-Repo Documentation rule without child-run filing.
