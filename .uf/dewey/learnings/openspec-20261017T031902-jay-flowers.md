---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-17T03:19:02Z
identity: openspec-20261017T031902-jay-flowers
tier: draft
---

Deferred-validation tasks (the task 9.2 pattern) fire only at the deferring change's own archive gate, where task-completion enforcement lives. The pattern fully guards events ordered before that gate: 'after sibling X archives, re-verify anchors' is safe when the proposal pins X's archive before this change's, because the unchecked task then blocks this change's archive until the re-verification runs. It does not guard sibling-lifecycle events with no ordering constraint: 'before sibling Y archives, annotate its delta' never fires if Y archives first, because Y's archive step reads only Y's own artifacts. When a deferred task guards a sibling's archive, pair it with an explicit archive-order pin in the proposal's Sequencing bullet (the Increment 1 sentence pattern: 'MUST be validated and archived after ...'), or record the supersession where the archive-time reader will see it — a superseded-by annotation in the sibling's own delta spec, the only order-independent enforcement point. Observed on unbound-force PR 745's feedback increment: task 9.3 guards persist-unleash-summary's archive with a sequencing bullet that names the sibling but, unlike the Increment 1 bullet in the same section, carries no archive-order pin. Complements openspec-20261016T222131 (prescribes the pin) and openspec-20261016T222137 (notes never-fires for prose) by explaining the trigger-location asymmetry between the two deferral cases.
