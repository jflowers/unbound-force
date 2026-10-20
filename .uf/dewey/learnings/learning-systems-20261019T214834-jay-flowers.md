---
tag: learning-systems
author: jay-flowers
category: gotcha
created_at: 2026-10-19T21:48:34Z
identity: learning-systems-20261019T214834-jay-flowers
tier: draft
---

Retrospective learnings stored during a change's own workflow that document defects in that same change are open fix obligations, not completed knowledge capture. In the fix-review-dispatch-recovery review (2026-10-19), two learnings stored by the change itself (documentation-gate-20261019T164207: both documentation-issue gates unplanned in tasks.md group 8; openspec-20261019T164204: RD-FR-009..011 assigned inside optional-profile-models' reserved RD-FR-009..018 range) accurately described unremediated defects — yet every tasks.md checkbox was marked complete and the workflow proceeded toward PR. Reviewers must treat a change's self-authored learnings as finding evidence and reconcile each one against the change's artifacts before approving: either the defect is remediated or task-tracked pre-merge, or the learning documents a knowingly-shipped gap that must be surfaced in the verdict. Storing the learning neither files the required issue nor fixes the defect.
