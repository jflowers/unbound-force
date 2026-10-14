---
tag: dewey
author: jay-flowers
category: gotcha
created_at: 2026-10-14T12:09:18Z
identity: dewey-20261014T120918-jay-flowers
tier: draft
---

Dewey compiled articles (store_compiled / dewey compile) are written with 'tier: draft' frontmatter; 'validated' requires an explicit dewey promote after human review, and promote updates graph.db without rewriting the durable markdown — so the machine-local knowledge graph can report 'validated' while the committed file still self-describes as 'draft'. Specs and proposals citing knowledge artifacts as evidence must verify the tier in the artifact's committed frontmatter (the durable, cross-machine source of truth), not the live graph state. Observed in the determinism-codification spec review: proposal.md claimed 'validated tier' for .uf/dewey/compiled/token-reduction.md while the file in the same diff declared tier: draft. When a promote has genuinely occurred, update the markdown frontmatter in the same change so the artifact remains self-describing (Observable Quality principle).
