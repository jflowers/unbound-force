---
tag: documentation-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-19T20:49:46Z
identity: documentation-pipeline-20261019T204946-jay-flowers
tier: draft
---

Feedback-triage criterion for scope-cut gaps in sibling artifacts: before granting a reviewer flag AUTHOR-DECIDES / follow-up treatment on the grounds that \"the spec intentionally scoped the siblings narrowly,\" check two conditions. (1) Are the incomplete sibling mandates lines the current diff itself added? A newly added mandate carries its failure-contract obligation with it — the gap is changed-line impact, not pre-existing code, so the confinement rule keeps the fix in-PR. (2) Does the change's own record (CHANGELOG entry, proposal Impact section) claim the behavior exists in those siblings? If it does, deferral would merge either a false change record or a newly introduced undefined path; the only consistent pre-merge state is to port the semantics or narrow the claim. Observed in PR 761 feedback item 3: FR-005 deliberately scoped sibling corrections to proposal-sourcing, but the sibling retrieval mandates were new diff lines and CHANGELOG lines 923-924 claimed FR-001 transient/permanent/all-skip failure behavior across all four commands — so porting the triage-issue Section 2.3 semantics into the three siblings (plus byte-identical mirror sync plus CHANGELOG alignment) was the correct ACCEPT, not a follow-up. Contrast: a gap in pre-existing, untouched sibling text (e.g., a false claim surviving at a section the diff never edited) legitimately routes to a tracked follow-up instead.
