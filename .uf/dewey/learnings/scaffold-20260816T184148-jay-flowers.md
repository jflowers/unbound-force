---
tag: scaffold
author: jay-flowers
category: pattern
created_at: 2026-08-16T18:41:48Z
identity: scaffold-20260816T184148-jay-flowers
tier: draft
---

When two packages need the same trivial helper function (like stripJSONCComments for JSONC parsing), the design trade-off between shared utility and inlined copy should be documented explicitly in the design document. For functions under 15 lines with a stable, well-known input format, inlining is preferred over creating a shared internal/textutil helper because it avoids cross-package coupling. The review council consistently rated this as LOW severity (acceptable trade-off) when the design document explicitly justifies it. If a third consumer appears, that triggers extraction to a shared package. Name the inlined copy to match its local scope (e.g., stripDCPComments in doctor vs stripJSONCComments in scaffold) — the naming difference serves as a scope hint that these are independent copies.
