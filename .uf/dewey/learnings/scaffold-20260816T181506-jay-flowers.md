---
tag: scaffold
author: jay-flowers
category: pattern
created_at: 2026-08-16T18:15:06Z
identity: scaffold-20260816T181506-jay-flowers
tier: draft
---

When handling JSONC files (JSON with comments) in the scaffold engine, the pragmatic approach is to write JSONC content as a raw string constant but read/parse via a simple stripJSONCComments helper that removes full-line // comments before json.Unmarshal. This avoids importing a JSONC parser dependency. The helper should be explicitly scoped and documented -- it only handles full-line comments (not inline comments after values, not block comments). The safe failure mode is important: if comment stripping produces invalid JSON, the function returns a malformed JSON error result rather than silently corrupting the parse. For the additive update path, the trade-off is that user-added keys are overwritten with canonical content -- this should be documented in both the design doc and the code comment.
