---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-17T03:18:48Z
identity: uf-workflow-20261017T031848-jay-flowers
tier: draft
---

When single-sourcing a duplicated literal union behind a shared const, enumerate every declaration by grepping the literal member values across production code before writing the completeness claim — never enumerate from the sites named in review feedback alone. The PR 745 feedback fix that introduced WORKFLOW_TIERS derived UnleashTier, WorkflowTier, and ExitTierSchema from the const and documented "a value added or renamed in one declaration cannot drift from the rest," but DetectResumeInputSchema.workflow_tier (z.enum(["openspec", "speckit"]) in the same plugin file the diff edited, and exercised by the diff's own new resume tests) remained hand-maintained — a fourth validation surface that would reject any future tier value the derived three accept, making the drift-impossibility claim false at birth. Detection heuristic: grep each literal member (e.g. "speckit") across lib/ and plugins/, then classify hits as validation surfaces (zod enums, type unions — MUST derive from the const), value comparisons and assignments (fine, type-checked against the derived union), or prose descriptions (legitimately restate values in tool descriptions; not single-sourcing targets). Mirror copies are byte-identical, so one grep per canonical tree suffices. Complements review-dispatch-20261016T222933 ("diff the documented failure mode against the vectors the refactor actually closes") with the mechanical enumeration step.
