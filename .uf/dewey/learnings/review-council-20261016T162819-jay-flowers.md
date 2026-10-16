---
tag: review-council
author: jay-flowers
category: pattern
created_at: 2026-10-16T16:28:19Z
identity: review-council-20261016T162819-jay-flowers
tier: draft
---

A three-round council fix loop converges when each round fixes HIGH+MEDIUM findings in code and defers LOWs to tracked issues carrying concrete fix text, with the full make check gate (818 vitest tests + Go -race suites + coverage) run between rounds so every fix round starts from a known-green baseline. Observed on unleash-deterministic-tools (2026-10-16): round 1 surfaced structural gaps (missing authorization docs for pre-implementation gates, unwired shared libs, predicate-registration scope), round 2 surfaced byte-level defects invisible to prose review (CRLF handling in the single-byte checkbox flip, staging closure missing three of eight lib modules), and round 3 returned advisory-only LOWs yielding APPROVE WITH ADVISORIES. Two practices made the loop cheap: deferring every LOW into a follow-up issue verified OPEN before re-review (unbound-force/unbound-force#741, #742, #743) so reviewers treated them as addressed-by-tracking instead of re-raising, and re-deriving the review diff from the working tree rather than reusing the previous round's manifest.
