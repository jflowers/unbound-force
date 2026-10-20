---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-20T16:18:31Z
identity: spec-authoring-20261020T161831-jay-flowers
tier: draft
---

When a review-fix round changes a behavioral derivation rule mid-change (e.g., unleash-tier-routing's quick-tier implement completion gaining the required `quick-pre-flight` claim alongside the `implement` claim in round 2), re-verify every artifact amended in EARLIER fix rounds that describes that rule — especially text written into pending sibling changes. Sibling amendments authored during one fix round encode that round's semantics; a later fix to the same behavior updates the primary artifacts and typically misses the sibling's summary sentence, leaving a durable contradiction that strict validation cannot flag and that archives permanently once the sibling merges. Sweep rule: after any fix that alters a MUST-level rule, grep both changes' artifacts for the old rule's distinguishing tokens (here: the singular 'the `implement` checkpoint claim' vs 'BOTH ... AND').
