---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-31T00:31:11Z
identity: uf-unleash-20261031T003111-jay-flowers
tier: draft
---

uf_unleash_detect_resume can report spec_review incomplete on a resume even though the spec review genuinely completed with an approving artifact: the specs-mode freshness check excludes tasks.md checkbox edits but not other new files appearing in the feature directory, and implement phase 8 of the review-dispatch-diff-manifest change had added an untracked verification log (openspec/changes/review-dispatch-diff-manifest/notes.md recording CI parity runs, openspec validation, and constitution checks). On the 2026-10-31 resume this produced step_statuses.spec_review false while checkpoint_claims.spec_review was true and the approving d2adc7f0 artifact existed. Safe disposition before acting on the incomplete reading: diff the feature directory against the reviewed HEAD — git status showed only checkbox flips in tasks.md plus the untracked notes.md, with proposal.md, design.md, and specs/ clean, so the approving artifact plus recorded checkpoint stood and spec review was not re-run. Lesson: after a completed implement phase, any untracked notes or verification file inside the feature dir will trip the spec-review freshness heuristic; verify what actually changed in the feature dir before re-dispatching a spec review on a resume.
