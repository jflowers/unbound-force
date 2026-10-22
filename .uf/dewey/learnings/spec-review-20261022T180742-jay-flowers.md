---
tag: spec-review
author: jay-flowers
category: gotcha
created_at: 2026-10-22T18:07:42Z
identity: spec-review-20261022T180742-jay-flowers
tier: draft
---

When a design document contains a reconciliation note claiming that a sibling artifact (proposal, spec delta) was "corrected" to cite the authoritative trail, reviewers must verify the correction actually landed in that artifact — reconciliation claims are not self-executing. In the ts-plugin-coverage-gate change, design.md's baseline reconciliation note stated "this design and the corrected proposal cite the artifact trail," yet proposal.md's "Recorded baselines" bullet still attributed 94.58% statements to "(round-3)" (the issue #780 shorthand) instead of the round-2 fresh measurement (tasks.md 10.7) that the narrative paragraph and the design both record. Partial corrections leave two conflicting attributions for the same number inside one governance artifact. When reconciling a numeric-provenance discrepancy across artifacts, grep every occurrence of the disputed value in the change directory before accepting the reconciliation note.
