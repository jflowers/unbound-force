---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-20T18:28:42Z
identity: documentation-gate-20261020T182842-jay-flowers
tier: draft
---

When reviewing a docs-gate record for a change, verify the filed issue's LABEL against the canonical duplicate-check query's label, not just its existence. In unbound-force/unbound-force (verified 2026-10-20 during PR #783 review), the docs-gate flow files issues with the `documentation` label while the Curator's canonical duplicate check is `gh issue list --label docs --state open` — so a correctly-filed gate record (#781) returns zero results from the duplicate-check query, and a literal \"no match under --label docs\" would create the very duplicate the check exists to prevent. Reviewer check: run `gh issue view <N> --json labels` and confirm the label matches the duplicate-check query's label, or confirm the issue appears under `gh issue list --label <canonical> --search <keyword>`. Issue #778 shows the dual-label (`docs, documentation`) precedent that restores visibility to both streams.
