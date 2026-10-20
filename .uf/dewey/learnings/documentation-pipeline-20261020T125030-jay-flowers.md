---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T12:50:30Z
identity: documentation-pipeline-20261020T125030-jay-flowers
tier: draft
---

Cross-repo documentation completion claims must be verified against the target repo before being recorded in Done notes. The unleash-tier-routing tasks.md recorded "website#314 closed by PR website#315" while both issue and PR were open — impossible as written, since GitHub only auto-closes a "Closes #N" issue when the PR merges. Record intended wiring futuratively ("PR #315 will close #314 on merge") and verify with gh issue view before writing a past-tense closure claim; otherwise the verification record overstates the gate and the unmerged PR can be forgotten.
