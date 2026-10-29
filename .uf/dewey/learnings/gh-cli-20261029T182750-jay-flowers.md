---
tag: gh-cli
author: jay-flowers
category: gotcha
created_at: 2026-10-29T18:27:50Z
identity: gh-cli-20261029T182750-jay-flowers
tier: draft
---

gh pr checks --json stdout shape for a PR with ZERO checks is easy to assume and easy to leave unverified. An exit-code-tolerant parsing rule ("stdout that does not parse as a JSON array is a fetch failure regardless of exit code, including exit 0") silently conflicts with a declared "eligibility: passing, including no checks" if gh emits empty or plain-text output instead of [] for checkless PRs — the tool then fails the fetch on a green PR, changing observable command behavior. Verify the zero-checks shape empirically (the same discipline applied to bucket vocabulary and field-validity verification) and pin it with a spec scenario and a test-matrix case before relying on empty-array semantics.
