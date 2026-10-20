---
tag: unleash-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T12:50:36Z
identity: unleash-pipeline-20261020T125036-jay-flowers
tier: draft
---

Quality gates embedded mid-step in the /uf.unleash pipeline are bypassed by resume-from-step routing whenever an earlier auto-checkpoint marks the step done. The quick-tier pre-flight hard gate runs inside Step 5 after the implement checkpoint claim is recorded; uf_unleash_detect_resume derives implement-done from that claim and resumes at code review, skipping Step 5 — so a resumed run or a post-failed-pre-flight re-run never executes the tier's only blocking build/test gate. Every MUST-execute gate needs its own resumability step or a durable completion record consulted by detect_resume.
