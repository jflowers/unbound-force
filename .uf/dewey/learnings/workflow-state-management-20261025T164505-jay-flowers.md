---
tag: workflow-state-management
author: jay-flowers
category: gotcha
created_at: 2026-10-25T16:45:05Z
identity: workflow-state-management-20261025T164505-jay-flowers
tier: draft
---

Structured sub-objects in tool input schemas persist only their declared fields, while free-form parameters (like the checkpoint tool's `data:` JSON string) persist anything. In uf-workflow, the `phase:` object's Zod schema declares only number/verdict/inventory and the state-writing constructor copies only {verdict, inventory, recorded_at} — so a spec, command template, and scaffold pins can all agree on a field (phase.iteration) that the tool silently strips at the seam (Zod strips undeclared keys by default). The failure signature: all artifacts quote each other consistently, yet the prescribed call shape diverges from the tool contract. Before approving a change that prescribes a structured tool-call shape, verify three things against the tool source: (1) the input sub-schema's declared fields, (2) the persistence constructor's copied fields, and (3) a write-then-read round-trip test proving the field survives storage and reload. Also remember that free-form `data:` merges are state-global (Object.assign across all steps), not step-scoped — two gates writing the same data key (e.g. data.iteration) will contaminate each other on resume.
