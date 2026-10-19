---
tag: documentation-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-19T19:22:22Z
identity: documentation-pipeline-20261019T192222-jay-flowers
tier: draft
---

The verification unit for a false-claim correction is the claim, not the section. When a docs-correction change fixes a false tool-output claim in one section of a command file, grep the ENTIRE file (and every sibling command) for the claim's signature text before declaring it corrected — a section-scoped fix leaves the file self-contradictory. Verified in code review of fix-triage-issue-dispatch-docs: the corrected review-council §4 says "Never source the proposals from dispatch_review_runs" while review-council §2 (line 276) still asserts "The tool returns ... consolidated findings, proposals ... Use these outputs for consolidation and finalization", and address-feedback §2.3.4 (line 358) retains the identical sentence; the CHANGELOG then overclaimed that all four commands "now document the counts-only output contract". The proposal's sibling mapping listed only the Store-Lesson-Proposals sections and the tasks inherited that scope — the output-shape claim lived in the dispatch sections nobody re-audited. Corollary: also grep for the claim's paraphrases (e.g. "runs_completed", "any warnings"), not just the tool name.
