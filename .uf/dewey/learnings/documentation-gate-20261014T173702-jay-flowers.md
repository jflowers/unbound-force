---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-14T17:37:02Z
identity: documentation-gate-20261014T173702-jay-flowers
tier: draft
---

When a documentation-gate task requires filing an issue in another repository (e.g., the org constitution's Cross-Repo Documentation rule requiring an issue in unbound-force/website), record the filed issue's number/URL in the change artifacts at filing time — in the tasks.md task line, the CHANGELOG entry (like "Docs: #N"), or the linked local docs issue — and apply the target repo's standard label. In the PR #718 review, the website issue existed but was undiscoverable from the change record: local docs issue #717 still said "(to be linked)", tasks.md 4.6 was checked with no reference, and unbound-force/website#303 lacked the `docs` label its sibling issues carry, so label-filtered duplicate checks missed it. Gate compliance was only verifiable by directly querying the target repo.
