---
tag: uf-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-17T03:36:19Z
identity: uf-workflow-20261017T033619-jay-flowers
tier: draft
---

When introducing a single-source const for a value set consumed by multiple validation surfaces (type unions, zod enums), audit every existing hand-enumerated copy before declaring the refactor complete. PR 745 round 1 found a fourth tier z.enum (DetectResumeInputSchema.workflow_tier in .opencode/plugins/uf-workflow/index.ts) that the WORKFLOW_TIERS refactor had missed — a silently divergent validator that strict typing could not catch because the hand-enumerated literal was itself well-typed. Durable fix pattern: export `const WORKFLOW_TIERS = [...] as const`, derive unions via `(typeof WORKFLOW_TIERS)[number]`, pass the const directly to `z.enum()`, then grep-sweep all remaining string literals for the values and classify each as value comparison (safe to leave) or validation surface (must derive from the const). The single-source doc comment should name every derived site (UnleashTier, WorkflowTier, ExitTierSchema, DetectResumeInputSchema) so future surfaces have a registry to check before hand-enumerating.
