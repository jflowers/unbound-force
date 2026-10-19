---
tag: gatekeeping
author: jay-flowers
category: gotcha
created_at: 2026-10-19T02:24:32Z
identity: gatekeeping-20261019T022432-jay-flowers
tier: draft
---

Spec-branch hygiene check for review councils: before approving an OpenSpec/Speckit change, diff the branch's changed files against the change's declared Impact file list. On the opsx/clarification-marker-superset branch, an unrelated pinned-dependency bump (@opencode-ai/plugin 1.4.10 → 1.19.0 plus a transitive cascade in .opencode/package.json / package-lock.json) rode along with no covering task, while the proposal and design simultaneously claimed 'no new dependencies'. Pinned runtime dependencies are gatekeeping-protected (org constitution Gatekeeping Integrity; AGENTS.md Behavioral Rules list 'pinned dependency versions') — modification requires the documented exception path (security/CI-reliability justification, verified integrity, rollback plan, validation evidence) and, per the commit-scope rule, a separate branch. AGENTS.md's Technology Stack section records the runtime pins, so any legitimate bump must update that section in the same change.
