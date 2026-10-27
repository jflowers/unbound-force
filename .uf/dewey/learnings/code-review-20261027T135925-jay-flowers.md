---
tag: code-review
author: jay-flowers
category: gotcha
created_at: 2026-10-27T13:59:25Z
identity: code-review-20261027T135925-jay-flowers
tier: draft
---

A review-fix correction applied to one instance of a repeated pattern must be audited against every parallel instance of that pattern in the changed surfaces — the defect class binds per call site, not per command. Verified on update-run-pipeline-plan iteration 2 (PR #839, 2026-10-27): iteration-1 finding B required the delegation timeout to be stated; the fix added "Set timeout: 1800000" to Delegation 1 (/uf.unleash) while Delegation 2 (/uf.finale) — whose commit-approval gate fires on every run, making the delegation always run to its timeout — retained the silent 600,000 ms default, even though the same PR's learning uf-workflow-20261027T133936 generalizes the rule to "every prescribed delegation." Reviewer recipe for fix-loop re-reviews: for each iteration-N finding, identify the pattern class the fix addresses, enumerate every other instance of that pattern in the diff's changed surfaces (grep the load-bearing clause, not the reviewer's fix list), and verify the fix generalized to all of them; co-shipped learnings captured during the review often state the generalized rule that a partial fix fails to meet. Complements uf-workflow-20261026T214950 (enumerating transcription sites at fix time) and address-feedback-20261026T215709 (twin-item atomic fixes): those cover authoring the fix; this covers re-reviewing its completeness.
