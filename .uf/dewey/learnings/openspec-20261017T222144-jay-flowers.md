---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-17T22:21:44Z
identity: openspec-20261017T222144-jay-flowers
tier: draft
---

When a design decision defines a term one way and the delta spec redefines it more narrowly, the spec wins as the durable baseline — design.md is archived with the change while openspec/changes/*/specs/ is what later phases promote. In command-prose-pilot, D10 defined boilerplate as blocks "repeated across commands" referenced by name from other documents, but the spec's "Boilerplate Defined Once" requirement defined it as within-one-command repetition, silently dropping the cross-command rule from the capability. Before approving an OpenSpec change, diff each design decision's term definitions against the delta-spec requirements that derive from them.
