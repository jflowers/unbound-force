---
tag: dependency-governance
author: jay-flowers
category: gotcha
created_at: 2026-10-19T11:11:08Z
identity: dependency-governance-20261019T111108-jay-flowers
tier: draft
---

A declared npm dependency bump's operational checklist must include the transitive engine floor. The clarification-marker-superset D7 refresh (@opencode-ai/plugin 1.4.10→1.19.0) pulled ini 6→7, whose engines range (^22.22.2 || ^24.15.0 || >=26) raised the plugin suite's minimum Node above what sibling native packages in the same lock still advertise (^20.19.0 || >=22.12.0). npm treats engines as warnings, so CI on a floating 'node-version: 22' pin stays green while contributors on Node 20 or early 22.x degrade silently (EBADENGINE warnings, undefined runtime behavior if the package executes). When a change records a version bump in AGENTS.md Technology Stack, record the implied runtime floor and verify the CI node pin satisfies it in the same task — an 'engine watch-item' with no owning task is an unmitigated environment regression, not a mitigation.
