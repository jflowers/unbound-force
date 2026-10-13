---
tag: token-reduction
author: jay-flowers
category: pattern
created_at: 2026-10-13T02:16:13Z
identity: token-reduction-20261013T021613-jay-flowers
tier: draft
---

When extracting deterministic procedures from LLM command templates into plugin tools (token reduction), the rewritten command template should preserve brief examples of tool output formats near the LLM decision points that consume them. The LLM needs to know what shape of data it will receive to make good decisions (e.g., commit message generation needs to know what normalizedModel looks like). Full algorithm details belong in the tool, but 1-2 output examples near the consumption site cost minimal tokens and prevent the LLM from misinterpreting tool results.
