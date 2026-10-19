---
tag: regex-security
author: jay-flowers
category: pattern
created_at: 2026-10-19T15:35:01Z
identity: regex-security-20261019T153501-jay-flowers
tier: draft
---

When reviewing a regex pattern change in a security-sensitive tool (clarification marker grammar consumed by scan/resolve/detect_resume), verify three properties: (1) ReDoS resilience — lazy quantifiers inside character classes that exclude the terminator character are safe because the engine has an unambiguous exit; (2) state leakage — a `g`-flagged regex used only via per-line `String.matchAll` cannot leak `lastIndex` across lines; (3) extraction completeness — a fallback to the raw match text (`match[0]`) prevents empty-question wedge states where the schema rejects the input but the marker blocks the pipeline. All three properties are satisfied by the CLARIFICATION_MARKER_PATTERN superset grammar.
