---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-15T23:44:16Z
identity: documentation-gate-20261015T234416-jay-flowers
tier: draft
---

Documentation-gate verification in the unbound-force org has a label asymmetry: unbound-force/unbound-force labels documentation issues "documentation" while unbound-force/website labels them "docs". Running `gh issue list --repo unbound-force/unbound-force --label docs --search <keyword>` returns false negatives even when a matching open issue exists (observed with issue #736). When verifying claimed documentation issues, omit the label filter and search by keywords, or verify directly with `gh issue view <N> --repo <owner>/<repo>`; confirm the issue body names the change's spec path and carries a "what needs documenting" checklist before crediting the gate as satisfied.
