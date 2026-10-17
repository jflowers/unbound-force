---
tag: documentation-gate
author: jay-flowers
category: reference
created_at: 2026-10-17T12:35:27Z
identity: documentation-gate-20261017T123527-jay-flowers
tier: draft
---

In review-council re-reviews (round N after a REQUEST CHANGES round), a round-1 documentation finding can be resolved at the PR-body level rather than in the repo tree, and this is verifiable only through the dispatch review-context summary of the PR body. Observed on PR 745 round 2 (unleash-deterministic-tools): openspec tasks.md task 8.3 still contains a checked sub-bullet instructing "MUST add Closes #707", but #707 was closed 2026-10-16 by a sibling change (persist-unleash-summary); the PR body threads "Refs #707" deliberately so no close keyword is emitted. Re-verification recipe for the Curator in re-reviews: map each round-1 doc-domain finding to exactly one of three dispositions — (1) fix commit visible in the head diff, (2) tracked deferral issue (verify it is OPEN and its body carries the deferred item, e.g. #743 for round-2 LOWs including the #739 architecture.md scope-row gap and CHANGELOG completeness clause), or (3) PR-body-level resolution visible in the review context; re-raise only findings with none of the three. Residual stale instruction text inside openspec/ artifacts hits the internal-path exemption (spec artifacts are not user-facing) and warrants no finding.
