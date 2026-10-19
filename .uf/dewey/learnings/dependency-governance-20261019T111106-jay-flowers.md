---
tag: dependency-governance
author: jay-flowers
category: gotcha
created_at: 2026-10-19T11:11:06Z
identity: dependency-governance-20261019T111106-jay-flowers
tier: draft
---

A pinned dependency version is a record stored in more places than the manifest and its tests: unarchived OpenSpec spec deltas can pin versions by MUST requirement. Before moving a pin, enumerate every record — package.json + lock, scaffold/embedded mirror copies, test constants and testdata baseline hashes, AGENTS.md Technology Stack, and any spec requirement text (e.g., review-council-multi-model-fanout SC-FR-003 'Reproducible Plugin Dependencies' pins @opencode-ai/plugin 1.4.10 and the b628c764 baseline lock SHA by MUST). A bump that migrates the manifest, test, and docs records but not the spec record archives a governance MUST that contradicts the shipped pin, forcing future review councils to flag the repository's own state as a gatekeeping violation. Reconcile the spec requirement in the same change that moves the pin — via a MODIFIED requirement anchored to the predecessor's unarchived text (the chained-change pattern) or an explicit pre-archive update task recorded in the change's gate-migration list.
