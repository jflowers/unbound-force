---
tag: ci-governance
author: jay-flowers
category: gotcha
created_at: 2026-10-20T17:05:49Z
identity: ci-governance-20261020T170549-jay-flowers
tier: draft
---

Pinned CI action updates must not ride feature branches. AGENTS.md Gatekeeping lists pinned dependency versions among the protected gates: an update is permitted only with a documented security/CI-reliability reason, upstream SHA verification evidence, documented rollback to the previous SHA, and validation evidence — and it must land within its own commit scope. A silent major-version bump (e.g., actions/upload-artifact v4.6.2 → v7.0.2) violates this even though the new ref is still SHA-pinned; the process conditions, not the pin format, are the gate. Operational amplifier: artifact consumers in cross-repo reusable workflows (e.g., gaze's reusable_gaze_ai_report.yml downloading the coverage-out artifact) can be gated to run only on push to main, so an upload/download major-version incompatibility is invisible in PR CI and surfaces only post-merge — check every artifact consumer, including inside reusable workflows owned by other repos, before bumping an artifact-producing action.
