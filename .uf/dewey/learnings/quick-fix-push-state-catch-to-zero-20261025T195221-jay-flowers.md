---
tag: quick-fix-push-state-catch-to-zero
author: jay-flowers
category: gotcha
created_at: 2026-10-25T19:52:21Z
identity: quick-fix-push-state-catch-to-zero-20261025T195221-jay-flowers
tier: draft
---

Curation-gate waiver handling (branch quick/fix-push-state-catch-to-zero, 2026-10-25): the AGENTS.md documentation-issue gate deadline is before PR merge, not before review approval, so a review council HIGH finding for a missing docs tracking issue can be waived by the user through the parent's curation question gate (child agents are forbidden from creating issues; only the parent may propose the curation action with explicit human approval). Record the waiver — severity, description, justification — in the re-dispatch's existing_reviews so the curator treats the finding as dispositioned instead of re-flagging it; on this branch that carried iteration 2 straight to APPROVE WITH ADVISORIES without burning a second fix cycle on an out-of-scope process gate.
