---
tag: dependency-governance
author: jay-flowers
category: gotcha
created_at: 2026-10-19T02:24:38Z
identity: dependency-governance-20261019T022438-jay-flowers
tier: draft
---

The .opencode/package.json dependency pins are triple-protected governance, not convenience metadata: AGENTS.md Gatekeeping lists pinned dependency versions as non-negotiable gates; the unarchived review-council-multi-model-fanout change mandates them by spec (SC-FR-003 "Reproducible Plugin Dependencies", with manifest/lock consistency verification and a recorded baseline lock SHA256); and the Commit Scope rule forbids mixing unrelated manifests into feature branches. When reviewing an OpenSpec/Speckit change, always diff the proposal's declared Impact file list against the actual working-tree diff — undeclared changes to package.json/package-lock.json (or go.mod) are gatekeeping violations even when the declared spec work itself is clean. A legitimate pin bump requires its own change documenting the security/CI-reliability justification, verified target, rollback path, validation evidence, the AGENTS.md Technology Stack sync, and a spec modification of the pin requirement.
