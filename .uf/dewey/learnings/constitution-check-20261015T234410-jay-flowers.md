---
tag: constitution-check
author: jay-flowers
category: gotcha
created_at: 2026-10-15T23:44:10Z
identity: constitution-check-20261015T234410-jay-flowers
tier: draft
---

OpenSpec proposal Constitution Alignment sections can silently go stale against org constitution amendments. The persist-unleash-summary proposal (created 2026-10-15) assessed only Principles I-IV while the org constitution v1.4.0 (amended 2026-10-14, one day earlier) carried six principles — the proposal's own design substantively addressed Principle VI (Deterministic Execution via tool extraction) yet the formal check omitted both V and VI. Recipe for spec reviewers and proposal authors: grep the active .specify/memory/constitution.md for '^### [IVX]+\.' headings to get the current principle count and names, then diff those against the proposal's Constitution Alignment section headings before treating the gate as complete. Proposals created within days of a constitution amendment are highest risk, and the newly added principle is often the one most relevant to the change at hand.
