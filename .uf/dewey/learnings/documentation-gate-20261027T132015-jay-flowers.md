---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-27T13:20:15Z
identity: documentation-gate-20261027T132015-jay-flowers
tier: draft
---

Disposition tables in docs-gate issues verify accuracy, not completeness: a per-page assessment table (the #739 gate-assessment-table pattern) records dispositions only for files the filer thought to assess, so verifying only the cited rows can miss stale copies of the superseded sentence in user-facing files the table never names. Completeness technique from the unleash-interactive-clarify review (PR #841, 2026-10-27): after verifying each cited disposition by reading the cited line ranges, sweep a wrap-safe fragment of the superseded sentence (per documentation-gate-20261027T011437 — e.g. "ambiguity" or "review failures", never the full sentence, which ~70-column hard-wrapping splits) across the entire user-facing docs surface — docs/ plus README.md, QUICKSTART.md, docs/heroes.md — not just the table's cited files. The sweep confirmed exactly the two tracked copies (docs/usage.md:152-154, docs/architecture.md:438-440, both tracked by #840) and cleared unlisted QUICKSTART.md, whose only /uf.unleash coverage is an abstraction-level command-list bullet. Cross-repo analogue: a source-filtered Dewey semantic search (source_id "disk-website") de-conditionalizes a hedged issue scope ("If the website documents...") into a named-page checklist — it confirmed content/blog/unleash-in-practice.md (What /unleash Does, 1. Clarify, Where It Pauses exit-point table) and content/docs/getting-started/common-workflows.md (Pipeline step-1 Clarify row) as carrying the superseded exit-to-judgment behavior for website#335. Rule: cite the sweep results in the review record so a disposition table's completeness is auditable, not just its accuracy.
