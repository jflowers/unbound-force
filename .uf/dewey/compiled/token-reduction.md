---
tier: draft
compiled_at: 2026-10-14T11:07:33Z
compiled_by: enmaas/rits/zai-org/glm-5-3
sources:
  - token-reduction-20261013T021613-jay-flowers
  - token-reduction-20261014T110708-jay-flowers
topic: token-reduction
---

## Current State

- When extracting deterministic procedures from LLM command templates into plugin tools, the rewritten template should preserve 1-2 brief examples of tool output formats near the LLM decision points that consume them. The LLM needs the shape of the data it will receive to make good decisions (e.g., commit message generation needs to know what `normalizedModel` looks like). Full algorithm details belong in the tool; a couple of output examples at the consumption site cost minimal tokens and prevent misinterpretation of tool results.
- The token-reduction arc (epic #659, culminating in the uf.unleash audit of issue #716) established that behavioral guards — compression-hardening re-read rules and demo-output-fidelity emit-time re-reads — mitigate prompt-drift symptoms but cannot cure the root cause: prescribed procedures and output formats living as conversation-content prose.
- The structural cure is executing deterministic logic in plugin tools. Tool-rendered output cannot drift after context compression, and mechanical instruction (parsing, existence probes, git choreography, template rendering) extracted from command markdown both saves tokens and eliminates re-reasoning errors.
- For review steps, direct dispatch (`resolve_base_ref` → diff capture → `plan_review_dispatch` → `dispatch_review_runs` → `consolidate_dispatch`) eliminates the worker "driver" layer entirely. The driver was never the reviewer — the review agents spawned by dispatch are — it was a token-expensive intermediary reading a 1,100-line command to call tools the parent could call directly.
- The uf.unleash audit surfaced two latent defects: (1) `uf_finale_pr_context` reads `.uf/artifacts/unleash-summary/<slug>.json` but no tool ever writes it, so `/uf.finale` context is always null; (2) uf.unleash's "auto-fix LOW/MEDIUM" step contradicts review-council's mandatory human-confirmation gate for spec edits — direct dispatch forces the calling command to own the fix policy explicitly.
