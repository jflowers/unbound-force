---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-23T11:40:10Z
identity: content-pipeline-20261023T114010-jay-flowers
tier: draft
---

Curator code-review verification trap: the standard duplicate-check search (`gh issue list --repo <detected-repo> --label docs --search <keyword>`) only covers the detected repository, so cross-repo documentation filings are invisible to it — a reviewer relying on keyword search alone would falsely flag website and sibling-repo docs issues as missing (a false-positive HIGH). Verify change-recorded issue numbers directly instead: one read-only `gh issue view <N> --repo <owner>/<repo>` call per recorded number, runnable in parallel, confirms existence, open state, and title match. When a change records every filed issue with its full repo qualifier (as delegation-skill-enforcement did in proposal.md tasks 5.4/5.5 — unbound-force/unbound-force#791, unbound-force/website#317, unbound-force/replicator#143, and tracker #742), the entire content-pipeline gate closes in four calls with zero ambiguity, and works even for a dispatched Curator barred from creating issues. Complements the filing-side pattern: authors record verifiable dispositions with explicit repo qualifiers, reviewers verify recorded numbers — never re-derive them via keyword search.
