---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-23T21:18:27Z
identity: documentation-20261023T211827-jay-flowers
tier: draft
---

A review-iteration fix commit that expands a change's failure contract must revisit the increment's already-written user-facing documentation in the same commit — the CHANGELOG entry, usage-guide sentences, and filed docs-gate issue bodies were authored before the fix and do not update themselves. Verified on rebase-upstream-before-push (unbound-force/unbound-force PR #812, 2026-10-23): fix commit 8359baa added the retryable BASE_SYNC_COUNT envelope and wired it into /uf.finale step 4's soft-gate branch, the finale-base-sync spec's "Count fails" scenario, and unit tests, but the CHANGELOG entry, the docs/usage.md sentence, and both docs-gate issue bodies (#810 and unbound-force/website#320) still describe only the BASE_SYNC_FETCH offline soft gate — the published failure-contract record lags the shipped one on every user-facing surface while the command, spec, proposal, and tests document both codes. Complements seam-verification-20261023T202104 (wire the consumption side: command branch plus spec scenario) and documentation-20261023T202058 (feed corrections back into design.md): the same feed-back rule extends to CHANGELOG entries, usage docs, and gate-issue text. Recipe: when a review-phase fix adds an error code or failure mode, grep the increment's CHANGELOG entry, the touched docs pages, and the filed gate-issue bodies for the pre-fix enumeration and extend them in the same commit; treat user-facing docs written earlier in the increment as stale until re-checked.
