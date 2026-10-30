---
tag: scaffold
author: jay-flowers
category: gotcha
created_at: 2026-10-30T21:22:34Z
identity: scaffold-20261030T212234-jay-flowers
tier: draft
---

Scaffold AGENTS.md append functions in unbound-force/unbound-force (ensureAGENTSmdPackSection, ensureAGENTSmdSiblingSection in internal/scaffold/scaffold.go) detect idempotency via strings.Contains on a "## Section" heading marker. Any pre-existing same-named user section suppresses the append while reporting "already configured" — concrete case: the dewey sibling repo's AGENTS.md ships a "## Sibling Repositories" org-repos table, so uf init there would skip the UF permission-safety guidance append. When adding new scaffold-appended AGENTS.md sections, probe for a UF-specific content phrase inside the section (e.g., "acquire_sibling_evidence") or emit a distinct action string for heading-present-but-content-differs so operators can distinguish suppression from prior deployment.
