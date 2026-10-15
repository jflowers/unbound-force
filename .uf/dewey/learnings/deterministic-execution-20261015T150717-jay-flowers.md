---
tag: deterministic-execution
author: jay-flowers
category: gotcha
created_at: 2026-10-15T15:07:17Z
identity: deterministic-execution-20261015T150717-jay-flowers
tier: draft
---

When reviewing prose-to-tool instruction migrations (Constitution Principle VI), verify instructed tool calls against the plugin source in .opencode/plugins/, not against the tool schema surfaced in the review session. In this repo, normalize_model_name (uf-workflow plugin, .opencode/plugins/uf-workflow/index.ts) accepts a required rawModelId string parameter, but the review-harness registration of the same tool displays an empty parameter schema — a session artifact that would incorrectly suggest that an instruction like "call normalize_model_name with your raw model identifier" mismatches the tool interface. The plugin source and the tool's own delta spec (finale-token-reduction/specs/plugin-tools) are the authoritative interface records. (Provenance: branch opsx/address-feedback-model-normalization, 2026-10-15, /uf.unleash code review; proposed by divisor-curator.)
