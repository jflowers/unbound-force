---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-19T22:36:02Z
identity: spec-authoring-20261019T223602-jay-flowers
tier: draft
---

Spec artifacts that cite file:line ranges, helper names, or test precedents must be verified against the working tree at authoring time. In the seam-verification spec review (2026-10-19), design.md cited the write_unleash_summary invocation at uf.unleash.md:1023-1039 (actual span: 1045-1061 — the cited range was the format_unleash_demo rendered-shape block), and tasks.md/design.md cited an executeTool helper precedent in uf-finale.test.ts (actual helper name: invokeTool at line 60). Notably, the same change's text-anchor spans ("Then persist the summary" → "## Guardrails") survived correctly while both the line-number and helper-name citations drifted. Prefer marker-string text anchors over line numbers when pinning command-document spans in specs and tasks.
