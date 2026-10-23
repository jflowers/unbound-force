---
tag: openspec-supersession
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:50:16Z
identity: openspec-supersession-20261022T225016-jay-flowers
tier: draft
---

When an OpenSpec change retires or replaces a mechanism (a gate, workflow, or option set), the Supersedes note must enumerate EVERY active (unarchived) change whose spec delta normatively references the retired mechanism — not just the carriers the author already knows about. Build the enumeration mechanically: grep all of openspec/changes/ for the retired mechanism's distinctive vocabulary (its name, its option labels, its scenario phrasings) and name every normative carrier (requirements and scenarios) in the note. A stale-reference sweep scoped to commands/skills/docs — as in spec-review-per-finding-gate's task 3.2 — excludes the active-change ledger where the normative references live: that change's Supersedes note named unleash-direct-review-dispatch and mandatory-gate-hardening but missed unleash-deterministic-tools, whose spec delta carries two MUST requirements and two scenarios requiring the retired consent gate (specs/unleash/spec.md:292-307, 338, 354). Archiving that change afterward would merge retired-gate requirements into openspec/specs/ alongside their replacements, creating contradictory canonical requirements with no resolution pointer. (Branch opsx/spec-review-per-finding-gate, 2026-10-22.)
