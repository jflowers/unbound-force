---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-17T03:19:09Z
identity: uf-workflow-testing-20261017T031909-jay-flowers
tier: draft
---

Single-sourcing refactors that extract a shared value list (e.g., WORKFLOW_TIERS) must enumerate the existing declaration sites mechanically — grep the member literals across the module — before writing a "cannot drift" doc comment. Derived types and converted zod enums gain compile-time protection, but a sibling hand-maintained z.enum in the same file stays invisible to that protection when its parsed value only flows into literal comparisons: a narrower union remains assignable to the wider derived type, so both addition and rename drift silently — no compile error (the comparison site compiles against any union) and no test failure (no test exercises a value outside the current set). Observed on PR 745 feedback round: UnleashTier, WorkflowTier, and ExitTierSchema derived from the new WORKFLOW_TIERS const while DetectResumeInputSchema.workflow_tier (uf-workflow/index.ts:1514) kept z.enum(["openspec", "speckit"]) — reversed order versus the const, itself evidence of independent evolution — and the new doc comment's blanket "a value added or renamed in one declaration cannot drift from the rest" obscured the fourth declaration until a declaration-site grep found it. This is the enum-domain analogue of uf-workflow-testing-20261016T225128 (enumerate grammar-consumer sites mechanically rather than trusting the fix's own scope). Detection signal: a new "single source" const plus a drift-immunity claim while grep still finds the member literals outside the derived declarations.
