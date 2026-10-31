---
tag: scaffold
author: jay-flowers
category: pattern
created_at: 2026-10-31T02:41:41Z
identity: scaffold-20261031T024141-jay-flowers
tier: draft
---

Scaffold-appended AGENTS.md guidance sections that key idempotency on a heading marker alone silently no-op on repos carrying an organic same-named section while reporting "already configured" — evidenced 2026-10-30 by dewey's "## Sibling Repositories" org-repos table vs unbound-force's new permission-safety section (ensureAGENTSmdSiblingSection). The repo's own spec 030 (agents-md-guidance) already established the two-signal pattern for guidance injection: a primary heading match plus a semantic fallback phrase, with the block treated as present only when either matches. When adding ensure*-style append functions: (1) probe for a tool-specific content phrase (e.g., "acquire_sibling_evidence") or emit a distinct "heading present, content differs" action so operators can distinguish suppression from prior deployment; (2) check redundant delivery surfaces before setting severity — the sibling guidance also ships via the tool-owned canonical content pack (FA-005 in content.md), so the append collision degrades rather than defeats deployment; (3) reviewer move: grep sibling repos' AGENTS.md files for the heading name before approving a heading-only idempotency probe.
