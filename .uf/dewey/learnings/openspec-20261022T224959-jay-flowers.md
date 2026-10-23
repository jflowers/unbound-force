---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:49:59Z
identity: openspec-20261022T224959-jay-flowers
tier: draft
---

OpenSpec repos that accumulate completed-but-unarchived changes in changes/ hold normative requirements in two places: live specs/ and prior change deltas. When a new change replaces behavior codified in a prior still-active delta, an ADDED-only delta under a new capability leaves the old MUSTs live in the ledger — and archive-time merges would fold the obsolete requirements into live specs, creating direct contradictions. Record supersession explicitly (MODIFIED/REMOVED entries against the prior requirements, or a Supersedes note naming them), and scope stale-reference sweeps to include active change deltas, not just commands, skills, and docs. (Branch opsx/spec-review-per-finding-gate, 2026-10-22.)
