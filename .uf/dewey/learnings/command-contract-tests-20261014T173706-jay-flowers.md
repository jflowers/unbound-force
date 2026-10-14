---
tag: command-contract-tests
author: jay-flowers
category: pattern
created_at: 2026-10-14T17:37:06Z
identity: command-contract-tests-20261014T173706-jay-flowers
tier: draft
---

Command contract tests that pin phrase presence/absence in command markdown cannot detect drift in unpinned numeric bounds or classification rules embedded in prose. When a command rewrite introduces governance-relevant limits — retry bounds ("at most twice"), default-deny failure classification — add explicit contract clauses pinning the exact bound and classification language, mirroring how the one-call mandate and detached-HEAD fail-closed rules are pinned. Otherwise a future edit changes the limit with no failing check, and gate-protected values (review retry limits are gate-protected per AGENTS.md) drift silently.
