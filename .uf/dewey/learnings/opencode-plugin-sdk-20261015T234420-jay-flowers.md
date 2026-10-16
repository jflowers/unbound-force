---
tag: opencode-plugin-sdk
author: jay-flowers
category: gotcha
created_at: 2026-10-15T23:44:20Z
identity: opencode-plugin-sdk-20261015T234420-jay-flowers
tier: draft
---

The @opencode-ai/plugin SDK's tool() factory only recognizes the `args` key (a zod ZodRawShape); a `parameters` key is silently ignored, which produces tools with empty exposed schemas and runtime arguments stripped before execute reaches them. This is the root cause of the known-broken checkpoint/get_progress tools in live sessions. Working precedent: the review-dispatch plugin declares all tools via zod `args:` (7 sites), and persist_unleash_summary follows it with an explanatory code comment. 14 legacy tools in .opencode/plugins/uf-workflow/index.ts still use the broken `parameters:` style and need migration. Any new plugin tool MUST declare parameters via zod `args`, and reviewers should check the declaration style when a tool's parameters arrive empty.
