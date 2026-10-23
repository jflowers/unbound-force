---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-23T16:22:03Z
identity: documentation-20261023T162203-jay-flowers
tier: draft
---

Documentation-gate issues filed without the `docs` label evade the content pipeline's label-keyed duplicate checks. During the 2026-10-23 rebase-upstream-before-push review, `gh issue list --repo unbound-force/unbound-force --label docs --search "finale" --state open` returned #710/#739/#706 but NOT #810 — the issue tracking that very change — because #810 and its companion website issue #320 were created with empty label sets. Verifying claimed filings by issue number via `gh issue view` still works (and remains the correct child-reviewer verification path, since dispatched reviewers cannot file or edit issues), but any future label-filtered triage or duplicate check will miss unlabelled gate issues and may file duplicates. Gate issues should be filed with `--label docs`, or labeled after the fact with `gh issue edit <N> --repo <repo> --add-label docs`.
