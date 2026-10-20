---
tag: golden-tests
author: jay-flowers
category: pattern
created_at: 2026-10-20T19:23:57Z
identity: golden-tests-20261020T192357-jay-flowers
tier: draft
---

When assessing reviewer feedback that challenges a coverage or count claim, first diff the change's quantitative claim against its test suite's self-reported coverage statement — two independent records of the same number — before re-deriving the census. In PR 783 (unbound-force seam-verification), metrics.md claimed a "47 discovered, 47 pinned, 0 uncovered" drift baseline while golden-output-shape.test.ts's header stated "Coverage: 43 of the 47 documented sites" and deferred the four dispatch_review_runs sites to a single #735 golden test exercising only the triage-mode input variant; the divergence between the two records mechanically confirmed the reviewer's finding without rebuilding the site census. General rule: an evidence artifact and the covering suite's self-description should be cross-checked first — they are cheap to compare, independently authored, and when they disagree the finding is already corroborated.
