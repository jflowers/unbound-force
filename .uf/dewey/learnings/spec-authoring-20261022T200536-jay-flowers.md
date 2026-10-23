---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-22T20:05:36Z
identity: spec-authoring-20261022T200536-jay-flowers
tier: draft
---

Before writing a MODIFIED requirement delta in an OpenSpec change, enumerate sibling active changes carrying deltas for the same capability and requirement name (glob openspec/changes/*/specs/<capability>/spec.md) and base both the replacement text and the 'Previously:' paragraph on the latest accumulated state. Non-cumulative MODIFIED deltas on the same requirement name silently drop each other's MUSTs at archive/sync time regardless of archive order, because the sync applies the delta text against the main spec. In delegation-skill-enforcement, the 'Mechanical task tool references' delta stacked correctly on unleash-pipeline-hardening's ADDED text, while the 'Command delegation tool' delta was drafted against the pre-hardening baseline and loses the hardening's model-resolution MUSTs in either archive order.
