---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T19:22:25Z
identity: review-dispatch-20261019T192225-jay-flowers
tier: draft
---

When a diff adds .uf/dewey/learnings/*.md files, mine them for self-acknowledged gaps before writing the review: a learning that documents a known deficiency in the PR's own new code — while shipping neither the fix nor a tracked follow-up issue — is review evidence of the gap itself. Recipe: for each diff-added learning, classify its documented gap as (a) closed by other hunks in the same PR, (b) tracked by a numbered follow-up issue, or (c) still open with no enforcement path. Category (c) is an admitted finding — a learning file cannot gate CI, so the gap persists unless the review requires the fix or a tracked issue. Observed on fix-triage-issue-dispatch-docs (PR #761, unbound-force/unbound-force): learnings review-dispatch-20261019T182357 (five untested execute branches of the new read_assessment_fields tool) and dependency-pins-20261019T182358 (missing engines-floor value assertion in scaffold_test.go) each documented a real gap in the PR's own new code while the PR shipped tests that stopped short of both gaps. The learnings also served as a precise checklist for verification greps (engines in internal/scaffold, read_assessment_fields in .opencode/test) that confirmed the gaps in seconds.
