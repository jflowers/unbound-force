---
tag: change-management
author: jay-flowers
category: gotcha
created_at: 2026-10-19T18:23:50Z
identity: change-management-20261019T182350-jay-flowers
tier: draft
---

When a change's work lands as a dedicated commit before its tasks.md artifact is authored or updated (e.g., a pin lockstep set committed early per commit-scope rules), the task checklist must be reconciled against that commit's actual file set — otherwise completion markers under-report done work. In fix-triage-issue-dispatch-docs, task 3.4 (scaffold mirror updates) stayed `- [ ]` even though the mirrors shipped in dedicated commit 0868c22d and mirror-parity tests were green; four council reviewers flagged it independently. Detection heuristic: after any dedicated early commit, grep tasks.md for unchecked items whose files appear in that commit's diff. Unchecked-but-complete markers are fail-closed (they block archive/resume gates) but still constitute spec-artifact/reality drift reviewers must flag.
