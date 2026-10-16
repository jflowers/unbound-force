---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-15T16:19:45Z
identity: documentation-gate-20261015T161945-jay-flowers
tier: draft
---

OpenSpec proposals that touch user-facing workflows benefit from a documentation-gate task modeled on openspec/changes/unleash-deterministic-tools task 8.2, the strongest example reviewed to date: (1) it enumerates the assessment targets explicitly — CHANGELOG.md, AGENTS.md, and the docs/ pages that actually document the affected surface — with a per-file disposition including the "no update expected" rationale, so the record distinguishes "considered and exempt" from "not considered"; (2) it names both issue targets required by governance (a docs-labeled issue in the current repo per the AGENTS.md documentation gate, and an unbound-force/website issue per the constitution Cross-Repo Documentation rule) with pre-merge filing timing; (3) it anchors duplicate avoidance by listing the specific open issues most likely to overlap, each verified open at proposal time — reviewers can then validate the anchors mechanically with gh issue view; (4) content-pipeline exemptions (blog/tutorial) are recorded with a dated maintainer decision rather than left implicit. The one gap in the exemplar: enumerate the gate's FULL file set (README.md was silently omitted) rather than only the files judged affected.
