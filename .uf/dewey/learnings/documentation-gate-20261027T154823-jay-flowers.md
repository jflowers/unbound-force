---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-27T15:48:23Z
identity: documentation-gate-20261027T154823-jay-flowers
tier: draft
---

Spec-review heuristic for the stacked documentation gates: a documentation task that correctly names and scopes the AGENTS.md repo-local gate ("file a documentation issue against this repo") can still leave the org constitution's Cross-Repo Documentation gate (unbound-force/website tracking issue, MUST exist before the implementing PR merges for user-facing changes) entirely untasked. Single-gate scoping is the subtler conflation form: unlike a targetless "file a documentation issue" task, a task citing the AGENTS.md gate with the correct repo target reads as complete. Observed in replicator-version-floor spec review (2026-10-27): task 3.2 cited the AGENTS.md gate while no task, Impact entry, or constitution-alignment note covered the website gate. Review check for a spec that self-identifies as user-facing: grep tasks.md and proposal.md for "unbound-force/website" — sibling-change convention (unleash-deterministic-tools task 8.2, unleash-interactive-clarify task 6.2, unleash-direct-review-dispatch task 6.3) names the repo explicitly, so absence of the string means the second gate is untasked and needs a search-first file-or-reference task recording both issue numbers, or a recorded exemption rationale (none applies to user-facing CLI output changes; the constitution exempts only purely internal, test-only, or CI-only changes). Extends learnings documentation-gates-20261022T225014 and documentation-gate-20261014T185718, which cover the general conflation and its implementation-phase form.
