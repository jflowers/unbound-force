---
tag: change-management
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:03:10Z
identity: change-management-20261020T000310-jay-flowers
tier: draft
---

Fix-loop iterations that adopt reviewer-requested refactors or doc corrections silently invalidate spec-artifact and CHANGELOG claims written against the base diff ("no existing X changes", "the only edit is Y", per-section enumerations). Two failure modes observed on fix-triage-issue-dispatch-docs (PR 761): (1) the OpenSpec proposal's "the only plugin-side edit is the additive read_assessment_fields tool" became false after the fix-loop extracted a shared readRunFiles loader across three existing tools and hardened assessmentFieldMarker — the unarchived delta no longer described the change it will archive; (2) a distributed CHANGELOG enumeration attributed claims to named sections ("the exact same payload feeds ... finalization", "the dual-mode exactly-once scoping") that fail per-claim × per-section verification for commands deliberately designed to differ (review-pr finalizes directly via finalize_review_dispatch in §5b and is single-mode per FR-005). Verification recipe after every fix-loop commit: re-diff each enumerated file/section claim sentence against the cumulative base..head diff, and amend the unarchived OpenSpec delta (or add tasks) for any scope expansion before proceeding to the next iteration or archive.
