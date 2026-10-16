---
tag: uf-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-16T15:26:44Z
identity: uf-workflow-20261016T152644-jay-flowers
tier: draft
---

When a value set is shared between .opencode/lib renderers and .opencode/plugins zod schemas, declare it once as an `as const` array in lib (e.g. UNLEASH_EXIT_VARIANTS), derive the lib type via (typeof VARIANTS)[number], and feed the same array to z.enum in the plugin. Parsing the schema then guarantees inputs conform to the shared type with zero duplicated literals. The tier value set ("speckit" | "openspec") shows the counter-pattern: three separate declarations (UnleashTier in unleash-templates.ts, WorkflowTier and ExitTierSchema in uf-workflow/index.ts) that are only kept safe by an incidental compile-time bridge — follow the UNLEASH_EXIT_VARIANTS pattern instead. (Round-2 council, run e5abd9fe, artifact 8601976b.)
