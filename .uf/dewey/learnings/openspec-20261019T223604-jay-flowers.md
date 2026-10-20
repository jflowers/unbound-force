---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-19T22:36:04Z
identity: openspec-20261019T223604-jay-flowers
tier: draft
---

When an OpenSpec delta modifies a capability whose main spec does not exist yet (predecessor change landed but is unarchived), verify inter-delta consistency directly against the unarchived predecessor's delta — requirement-name collisions, pinned pack/tool versions, rule-ID ranges — and record the archive-ordering dependency in the proposal. In the seam-verification review (2026-10-19), the determinism-policy capability had no main spec because determinism-codification (PR #723) sat unarchived in changes/; diffing the two deltas confirmed no requirement-name collisions and no version conflict, and surfaced the ordering risk that whichever change archives first creates the main spec.
