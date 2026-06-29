---
tag: review-context-skill
author: yvonne-devlin
category: pattern
created_at: 2026-06-29T12:53:08Z
identity: review-context-skill-20260629T125308-yvonne-devlin
tier: draft
---

When migrating a consuming command to load a shared skill instead of inlining logic, the triage phase is critical for resolving design questions upfront. For the review-context skill migration (#295), the triage identified three key decisions before any spec was written: (1) hard dependency vs. graceful degradation — resolved by examining the pre-flight skill precedent, where all three consumers already treat it as a hard dependency with no fallback; (2) behavioral parity vs. expansion — resolved by side-by-side comparison of the skill's protocols against the inline logic, confirming 1:1 extraction; (3) regression verification method — accepted as manual, matching the pre-flight risk profile. Resolving these during triage prevented the spec review from raising the same questions later, resulting in a clean 5/5 APPROVE with zero HIGH/CRITICAL findings.
