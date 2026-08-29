---
tag: add-todowrite-to-pipelines
author: jay-flowers
category: pattern
created_at: 2026-08-29T19:31:01Z
identity: add-todowrite-to-pipelines-20260829T193101-jay-flowers
tier: draft
---

When adding consistent instruction blocks across multiple pipeline command templates (like the TodoWrite Progress Tracking sections), the instruction content should use terminology that matches each command's local structure rather than forcing uniform terminology. For uf.unleash and uf.finale, which use numbered "Steps", the TodoWrite block refers to "steps". For uf.review-council, which uses "Phase 1a/1b/1c" and "Steps 2-6" and "Steps 7a-7g", the block refers to "checklist items". For uf.address-feedback, which uses "Phase 1-3" and "Phase 4.1-4.5", the block refers to "phases and sub-steps". The Architect reviewer (scoring 9/10) explicitly confirmed this variation is justified — it adapts to local context while maintaining the same core pattern (initialize pending, transition in_progress/completed, re-initialize on resume).
