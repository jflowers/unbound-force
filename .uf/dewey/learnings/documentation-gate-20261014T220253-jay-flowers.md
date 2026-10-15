---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-14T22:02:53Z
identity: documentation-gate-20261014T220253-jay-flowers
tier: draft
---

In unbound-force/unbound-force, the documentation gate's duplicate-check workflow discovers prior docs issues via `gh issue list --label docs --state open`. An issue filed without the `docs` label is invisible to that query: #728 (filed 2026-10-14 for the unleash-direct-review-dispatch change) is OPEN with correct content but unlabeled, and did not appear in the docs-labeled list — it was only confirmable via the issue number recorded in tasks.md. When verifying documentation-gate compliance, resolve filings by the issue number recorded in the tasks artifact rather than by label search alone, and confirm the `docs` label is applied when filing (`gh issue edit N --repo unbound-force/unbound-force --add-label docs`). Note the convention is repo-specific: unbound-force/website docs issues (e.g., #302, #307) are conventionally unlabeled, so do not flag missing labels there.
