---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-27T00:16:02Z
identity: documentation-gate-20261027T001602-jay-flowers
tier: draft
---

Section overlap is not delta absorption: when a documentation-gate search-first considers consolidating into an open issue (reference-not-duplicate), the consolidation precedent does not transfer just because the open issue scopes the same docs sections. unleash-interactive-clarify task 6.2 (2026-10-27) found that #739's scope table pins the deterministic-tool migration deltas (tool-driven steps, artifact-first resume, unleash-summary artifact) for the same docs/usage.md and docs/architecture.md sections the clarify ask gate supersedes ("Exits to human judgment only when it encounters ambiguity, review failures, or merge conflicts"), so the marker-superset consolidation (which referenced #739 for a workflow delta that change's scope arguably absorbed) did not apply — the scope table's enumerated deltas, viewed via gh issue view, are the ground truth. Verdict: file both gate targets fresh (unbound-force#840 + unbound-force/website#335, cross-referenced, overlapping siblings referenced for consolidation-at-landing), and name the open issue as the consolidation point inside the filed issue rather than presuming absorption. Extends the documentation-gate learning family (per-file dispositions + both targets recorded in tasks.md at filing time; Dewey MCP was unavailable at storage time, so this learning was written directly to the vault file convention).
