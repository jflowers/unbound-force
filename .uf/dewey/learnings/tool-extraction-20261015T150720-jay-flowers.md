---
tag: tool-extraction
author: jay-flowers
category: gotcha
created_at: 2026-10-15T15:07:20Z
identity: tool-extraction-20261015T150720-jay-flowers
tier: draft
---

When migrating inline instruction prose to a tested tool (deterministic-instruction migration, Constitution Principle VI), verify "zero behavioral change" claims against the tool's test suite, not the prose. The normalize_model_name tool's step 4 strips trailing -N version segments only when preceded by a digit (`while (/\d-\d$/.test(name))` in .opencode/lib/uf-workflow-types.ts), while the pre-migration prose described an unguarded trailing -N strip — so migrating /uf.finale and /uf.address-feedback from prose to tool changed the produced Assisted-by trailer for model families like claude-sonnet-4 (old prose literal reading: claude-sonnet; tool: claude-sonnet-4). The tool's tests document the guard as deliberate ("-4 is preserved because preceded by e (part of model name)"). Tested tools may intentionally deviate from the prose they replace; the tests are the source of truth for equivalence claims in migration specs. Parity claims in prose-to-tool migrations should cite the pinning test assertions and be framed as "behavior pinned to the tested tool" rather than "zero behavioral change" when the prose path was non-deterministic LLM re-reasoning. (Provenance: branch opsx/address-feedback-model-normalization, 2026-10-15, /uf.unleash spec review + code review; proposed by divisor-guard in both.)
