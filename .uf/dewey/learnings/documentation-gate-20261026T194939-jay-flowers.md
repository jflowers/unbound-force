---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-26T19:49:39Z
identity: documentation-gate-20261026T194939-jay-flowers
tier: draft
---

A retrospective learning shipped in the same diff as the instruction text it corrects cannot substitute for fixing that text. Verified on update-run-pipeline-plan (2026-10-26, PR #839 review): the rewritten /uf.run-pipeline-plan command's paused-exit re-run step claims "the child resumes from its durable state" for all eleven variants, while the change's own learning (uf-workflow-20261026T182020) documents that the two tier-routing variants exit before any durable checkpoint exists and that "no routing context" must not be read as omitting the work-item description — yet the command, its scaffold mirror, the spec delta, design D4, and both filed docs issues all carried the unqualified claim, and none of the issue bodies mentioned the re-run prompt-content requirement. Draft-tier learnings are knowledge capture, not procedure of record; scaffold-propagated command text executes from what it says, not from what the vault knows. Reviewer check: when a diff adds both instruction text and a learning that corrects or narrows it, diff the learning's claim against every artifact restating the instruction (command, scaffold mirror, spec, design, filed docs issues) and require either a text fix or a recorded accepted-trade-off before merge.
