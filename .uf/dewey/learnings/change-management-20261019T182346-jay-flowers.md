---
tag: change-management
author: jay-flowers
category: gotcha
created_at: 2026-10-19T18:23:46Z
identity: change-management-20261019T182346-jay-flowers
tier: draft
---

When adopting pre-existing working-tree drift (e.g. a maintainer-approved, governance-gated dependency pin bump) into an in-flight spec change, commit the change's spec artifacts BEFORE the adopted implementation commit — or rebase immediately while the branch is unpushed — so branch history preserves the AGENTS.md spec-before-implementation ordering. On fix-triage-issue-dispatch-docs, the adopted @opencode-ai/plugin 1.19.0 lockstep was committed as 0868c22d while the spec artifacts remained uncommitted, leaving head_sha pointing at an implementation-only commit; trivially repairable pre-push via commit + rebase, unrecoverable once pushed. Extends learning change-management-20261019T125103 with the prescriptive remedy.
