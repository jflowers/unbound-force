---
tag: content-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-30T21:22:28Z
identity: content-pipeline-20261030T212228-jay-flowers
tier: draft
---

CHANGELOG numerical claims go stale when review-iteration advisory fixes add artifacts after the entry is written. Verified on sibling-evidence-agent-guidance (quick tier, review iteration 2, 2026-10-30): the entry said "with six new scaffold tests" while the final diff added nine TestEnsureAGENTSmdSiblingSection_* functions — iteration 2 appended ReadFailure, WriteFailure, and NoTrailingNewline without refreshing the count, and the pre-flight record ("all 9 ... 6 original + 3 new") contradicted the shipped entry. Recipe: when any post-entry iteration adds or removes tests, files, or commands, re-verify every count in the CHANGELOG entry against the final diff before submission (FA-002 numerical consistency); the pre-flight summary's counts are the cross-check source.
