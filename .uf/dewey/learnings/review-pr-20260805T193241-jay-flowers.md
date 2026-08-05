---
tag: review-pr
author: jay-flowers
category: gotcha
created_at: 2026-08-05T19:32:41Z
identity: review-pr-20260805T193241-jay-flowers
tier: draft
---

When reviewing agent command files (Markdown instruction files like .opencode/commands/*.md), conditional blocks that gate multiple instructions are a common source of bugs. In the uf.review-pr.md Step 7 bug (#441), a single condition "if there are findings with severity HIGH or above" gated both the framing text paragraph AND the AskUserQuestion verdict-posting prompt. The fix was to split Step 7 into two distinct blocks: one conditional (framing text, gated by HIGH+ findings) and one unconditional (AskUserQuestion, always fires). When writing or reviewing agent command files, verify that each conditional block gates exactly the instructions it should — look for "collateral gating" where unrelated instructions get caught inside a conditional scope.
