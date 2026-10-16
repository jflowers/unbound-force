---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-15T16:47:21Z
identity: documentation-gate-20261015T164721-jay-flowers
tier: draft
---

Spec defect-fix plans must search the issue tracker for standalone feature requests that the fix resolves, not only the originating audit issue. In the unleash-deterministic-tools OpenSpec change (2026-10-15), defect 1 (unleash summary never written) was sourced from audit issue #716 and threaded as originating_issue, but open feature issue #707 ("/uf.unleash should persist demo summary for /uf.finale PR body generation", filed 2026-10-12) independently requested the same capability that write_unleash_summary implements. Without an explicit "Closes #707" linkage in the PR body, the issue orphans after merge. Pattern: during spec review, enumerate each user-visible capability the change delivers and gh-search the tracker for it; link or close every matching open issue in the proposal or tasks artifact, not just the issue that prompted the work.
