---
tag: workflow-state-management
author: jay-flowers
category: gotcha
created_at: 2026-10-25T16:45:14Z
identity: workflow-state-management-20261025T164514-jay-flowers
tier: draft
---

When a command template instructs recording a new field inside a structured tool parameter (e.g., the checkpoint tool's `phase` object), verify the field survives the tool's full persistence path before shipping the instruction — and pin the seam, not just the text. Observed on PR 815 (unleash-build-test-fix-loop): the phase-checkpoint template records `iteration` inside the `phase:` object, but the unchanged checkpoint tool drops it at three independent layers — the zod phase schema declares only number/verdict/inventory and zod's default strip mode silently removes unknown keys; execute() explicitly reconstructs the record from the three declared fields; upsertCheckpointStep persists only {verdict, inventory, recorded_at}. The call succeeds and returns state, so the loss is silent, and scaffold pins (strings.Contains on the template) verify the instruction rather than the seam. By contrast, fields riding the free-form `data` parameter (JSON-parsed, Object.assign-merged into state.data) persist fine — which is why the same PR's quick-gate `data.iteration` and Step 6 `code-review-preflight` data wiring work while the phase wiring does not. Rule: a new write→read field on an existing tool requires either a round-trip test through the real persistence path (DE-007) or routing through a schema-supported parameter; grep the tool's zod schema AND its execute/upsert reconstruction before instructing a field placement, because explicit record reconstruction drops fields even where schema parsing would pass them through.
