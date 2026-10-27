---
tag: openspec-deltas
author: jay-flowers
category: gotcha
created_at: 2026-10-27T01:14:26Z
identity: openspec-deltas-20261027T011426-jay-flowers
tier: draft
---

In OpenSpec changes, a proposal "What Changes" bullet that introduces a new tool-input contract (e.g., a conditionally-required schema field with fail-closed validation) must be grounded in a delta requirement — design decisions and rejection tests alone leave the archived spec under-specifying behavior the test suite enforces (tests stronger than spec). Verified during the unleash-interactive-clarify spec review: the resolved_by/source conditional rule existed in the proposal, design D4, and tasks 2.1/4.1, but no ADDED/MODIFIED requirement stated it, while the repo's own precedent pins schema-level input bounds in requirements (the marker-grammar requirement's 4096-character question bound). Companion verification technique that worked well: for MODIFIED requirements anchored to unarchived predecessor changes, diff the new delta text against the predecessor's current spec.md — the changed clauses should exactly match the change's own designed-clause inventory (task 8.1's list). In this change the sentence-level comparison against openspec/changes/clarification-marker-superset/specs/unleash/spec.md confirmed the "verbatim except designed clauses" claim with exactly the four declared clause changes.
