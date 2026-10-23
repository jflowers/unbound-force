---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-23T12:01:57Z
identity: openspec-20261023T120157-jay-flowers
tier: draft
---

OpenSpec inter-change supersession gotcha (verified while reviewing fix-review-dispatch-correlation-release): when change B supersedes a scenario or rationale clause in a requirement defined by a still-unarchived change A, deferring reconciliation to "the archive step" leaves no executable owner — the OpenSpec archive process syncs only the archiving change's own delta (ADDED/MODIFIED/REMOVED sections) into openspec/specs/ and never rewrites requirements introduced by other changes. The registry then carries adjacent requirements describing the same behavior differently. Concretely: design D4 of fix-review-dispatch-correlation-release said "the archive step should reconcile that example" for RD-FR-027's fix-loop example (defined by unarchived fix-review-dispatch-recovery), but no task owned the edit and the delta had no MODIFIED section. The OpenSpec-native fix: include a MODIFIED Requirements section for the superseded requirement in change B's spec delta — viable whenever B's archive ordering after A is already a documented constraint (as R6 documented here) — or add an explicit tasks.md item that edits the registry requirement at archive time.
