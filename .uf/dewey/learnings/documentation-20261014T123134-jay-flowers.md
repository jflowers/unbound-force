---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-14T12:31:34Z
identity: documentation-20261014T123134-jay-flowers
tier: draft
---

Spec docs-gate exemption claims for convention-pack or constitution changes in unbound-force/unbound-force are contradicted by the repo's own guidance: specs/030-agents-md-guidance/data-model's Website Documentation Gate examples explicitly list 'New convention pack added' as requiring a website issue (with no repo-local vs scaffold-propagated distinction), and README.md references the org principle set in multiple sections — the Constitution section (principle enumeration plus the hero-alignment note) AND the Specification Framework section ('alignment assessment against the four org principles'). A constitution amendment or pack addition therefore requires (1) a website documentation issue before PR merge and (2) a README.md grep for principle-count references, not just a Constitution-section edit. Observed in determinism-codification spec review iteration 2: the proposal claimed 'Docs gate: exempt — nothing user-facing propagates' while adding a pack, a skill, and Principle VI; README.md still said 'four core principles' against a live five-principle constitution.
