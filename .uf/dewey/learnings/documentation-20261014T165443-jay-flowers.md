---
tag: documentation
author: jay-flowers
category: reference
created_at: 2026-10-14T16:54:43Z
identity: documentation-20261014T165443-jay-flowers
tier: draft
---

A retrospective learning committed in a PR that prescribes extending a tracking issue does not execute itself — reviewers must verify the issue body actually reflects the prescription before treating the docs gate as satisfied. Observed in determinism-codification (PR #723, unbound-force/unbound-force): docs-gate issue #720 was filed at task-1.11 time scoping "constitution references" to docs/ only; the later retrospective learning (documentation-20261014T151529) identified stale principle enumerations in .opencode/agents/constitution-check.md lines 43/95/99 (and its drift-enforced scaffold twin) and prescribed extending #720 to cover them — the extension never happened, so the gap was untracked at review time. Sequencing is the usual culprit: issues are filed early (task order) while learnings are written late (retrospective), and nothing loops back. Reviewer recipe: for every learning in the diff that says "extend issue X" or "file issue Y", view issue X and diff its body against the learning's prescription; treat the learning as evidence OF the gap, not closure of it.
