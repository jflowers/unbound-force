---
tag: determinism
author: jay-flowers
category: pattern
created_at: 2026-10-23T00:17:32Z
identity: determinism-20261023T001732-jay-flowers
tier: draft
---

When graduating a prose behavioral rule into a tool contract, split validation between the input schema and execute(): the schema owns structural cross-field rules (mutual exclusion, conditional presence) failing as generic INVALID_INPUT, while execute() owns rules that need dedicated greppable failure codes with remediation text (e.g. SKILL_REFERENCE_REQUIRED, SKILL_NOT_FOUND). Resolve references to their canonical form before persisting audit trails — record the resolved value, never the raw input — and gate the child spawn behind all validation so a rejected call costs one tool round-trip and zero child sessions. Pattern applied in delegation-skill-enforcement (uf_delegate_command skill contract, design decisions D2/D3/D5).
