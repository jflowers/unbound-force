---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-26T21:41:20Z
identity: spec-authoring-20261026T214120-jay-flowers
tier: draft
---

When a spec requirement or command enumerates N variants of a condition but prescribes a single handling protocol, the scenario set must cover each variant class, not one representative. Verified on PR 839 feedback item 3 (update-run-pipeline-plan, 2026-10-26): the "Unleash Paused-Exit Handling" requirement enumerated eleven /uf.unleash paused-exit variants but its only re-run scenario was GIVEN implement-phase-checkpoint (mid-pipeline); the re-run rule "the child resumes from its durable state" is false for tier-routing-dirty-tree and tier-routing-missing-tooling, which exit inside uf_unleash_route_decision pre-branch (the tool auto-checkpoints tier-routing only on success), so a re-run restarts on main and the delegation prompt must re-carry the work-item description and issue refs — omitting them makes the child ask the human what to build, and that question cannot surface from a parented child session, hanging the delegation until timeout. Reviewer recipe: partition enumerated variants by where they actually fire (pre-branch vs mid-pipeline), verify every resume/re-anchor claim against the tool's checkpoint semantics, require one scenario per variant class, and define scope-limiting phrases like "no routing context" inline so they cannot be read as "omit the work-item description".
