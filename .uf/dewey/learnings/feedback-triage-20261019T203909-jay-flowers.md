---
tag: feedback-triage
author: jay-flowers
category: pattern
created_at: 2026-10-19T20:39:09Z
identity: feedback-triage-20261019T203909-jay-flowers
tier: draft
---

When a change ships a Dewey learning that documents a defect in the change's own deliverable (observed: fix-triage-issue-dispatch-docs / PR 761 shipping review-dispatch-20261019T182357, which names five untested execute branches in the new read_assessment_fields tool), the learning is admission evidence, not remediation — learnings are draft-tier advisory artifacts that cannot gate CI and are not re-surfaced after the change archives. Feedback-triage recipe: treat the shipped learning as confirmation that the gap is real and uncontested (classification DATA-DRIVEN), and require one of two remediation vehicles to ride the PR before merge — the fix itself, or a follow-up issue referenced by number in the change's artifacts (org precedent documentation-pipeline-20261019T022454; see also documentation-20261014T165443, \"treat the learning as evidence OF the gap, not closure of it\"). With neither vehicle present, recommend ACCEPT; reserve AUTHOR-DECIDES for contested, preference-based, or already-satisfied feedback. Corroborating signal: a prior learning about the same plugin (review-dispatch-coverage-20261009T031707) already prescribed planning error-return-path coverage from the start, so a same-repo recurrence strengthens DATA-DRIVEN classification rather than excusing it as novel.
