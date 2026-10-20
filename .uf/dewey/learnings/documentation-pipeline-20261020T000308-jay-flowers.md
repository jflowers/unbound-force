---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:03:08Z
identity: documentation-pipeline-20261020T000308-jay-flowers
tier: draft
---

Verification-evidence citations inside a change's own spec artifacts are themselves claims that require verification. In fix-triage-issue-dispatch-docs, proposal.md cited "verified: no `proposals` references in its command file" as the basis for excluding speckit.testreview.md from a docs-correction sweep, but the file contains three lesson-pipeline proposal references (submit_lesson_proposal line 226, parent-side processing line 263, prepare_lesson_learning→dewey_store_learning line 271). The substantive exclusion (no dispatch proposals-array consumption; no dispatch_review_runs/consolidate_dispatch calls) was correct and was accurately phrased in design.md as "does not consume the proposals array." When recording grep-based exclusion evidence in specs, either run the stated grep and quote its actual result, or phrase the evidence at the same precision as the substantive claim (e.g., "does not call dispatch_review_runs or consolidate_dispatch; its only proposal references are the separate lesson-proposal pipeline"). String-level "no X references" citations are trivially falsifiable and can misdirect follow-up audits (here #756) that trust them.
