---
tag: token-reduction
author: jay-flowers
category: pattern
created_at: 2026-10-14T11:07:08Z
identity: token-reduction-20261014T110708-jay-flowers
tier: draft
---

uf.unleash audit (issue #716) completed the token-reduction arc: behavioral guards (compression-hardening re-read rules, demo-output-fidelity emit-time re-reads) mitigate prompt-drift symptoms but cannot cure the root cause — prescribed procedures and output formats living as conversation-content prose. The structural cure is executing deterministic logic in plugin tools: tool-rendered output cannot drift after context compression, and mechanical instruction (parsing, existence probes, git choreography, template rendering) extracted from command markdown both saves tokens and eliminates re-reasoning errors. Direct dispatch (resolve_base_ref → diff capture → plan_review_dispatch → dispatch_review_runs → consolidate_dispatch) eliminates the cobalt-crush-dev "driver" layer entirely for review steps — the driver was never the reviewer, only a token-expensive intermediary reading the 1145-line council command to call tools the parent could call directly. Audit also surfaced two latent defects: (1) uf_finale_pr_context reads .uf/artifacts/unleash-summary/<slug>.json but no tool ever writes it — /uf.finale context is always null; (2) uf.unleash Step 4 "auto-fix LOW/MEDIUM" contradicts review-council's MANDATORY human-confirmation gate for spec edits — direct dispatch forces uf.unleash to own the fix policy explicitly.
