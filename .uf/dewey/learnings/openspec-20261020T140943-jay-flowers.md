---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-20T14:09:43Z
identity: openspec-20261020T140943-jay-flowers
tier: draft
---

When spec review returns APPROVE WITH ADVISORIES and the advisories identify defects in the change's own artifacts (over-broad acceptance criteria, incomplete Constitution Alignment sections, misdescribed verification commands), storing a Dewey learning about the defect does not discharge the correction — the artifact itself must be amended before the change ships. Observed in fix-dispatch-verdict-derivation (2026-10-20): the shipping diff contains both the learnings that declare FR-011's universal invariance claim false, the Constitution Alignment section incomplete (four of six v1.4.0 principles), and task 4.1's verification-path misdescription, and the uncorrected artifacts they describe. Delta specs archived into openspec/specs/ become governing requirements, so an advisory identified at spec-review time but left unfixed converts a review-time observation into a permanent false statement in the mainline spec. Rule: in the same iteration that records the learning, apply the learning's prescribed text fix to the artifact; a learning is the memory of a defect, not its remediation.
