---
tag: command-contract-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-20T16:57:15Z
identity: command-contract-tests-20261020T165715-jay-flowers
tier: draft
---

When multiple command files document an identical tool-output contract sentence, a single golden test executing one site's documented inputs pins the shared field set but leaves the other sites' documented input variants unexercised. State which reading the drift baseline uses: "N sites pinned" can mean N per-site executions (every documented input variant exercised) or one execution per distinct contract sentence. In seam-verification (issue #765), the 47/47/0 baseline counted the four dispatch_review_runs sites (identical seven-field sentence across uf.triage-issue.md, uf.review-council.md, uf.review-pr.md, uf.address-feedback.md) as pinned by the single #735 triage-input golden test, while the spec requirement read "every DE-002 example ... pinned by a contract test that executes the registered tool with the documented inputs" — per-site wording, single-variant execution. Prefer either one golden case per documented input shape or phrasing the requirement and baseline as contract-sentence-scoped so the claim matches what actually executes.
