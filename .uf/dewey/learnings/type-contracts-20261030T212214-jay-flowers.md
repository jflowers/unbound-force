---
tag: type-contracts
author: jay-flowers
category: gotcha
created_at: 2026-10-30T21:22:14Z
identity: type-contracts-20261030T212214-jay-flowers
tier: draft
---

When extending a serialized tool envelope with a new field via object spread (e.g., `{ ...envelope, child_session_id }` in uf-workflow's createDelegateCommandTool), extend the shared declared envelope type (ToolFailure in .opencode/lib/uf-workflow-types.ts) in the same change. A test needing a type cast to read the new field — `(result as { child_session_id?: string }).child_session_id` — is the symptom that the contract declaration lagged the serialized output. The shared lib type is the declaration of record for the JSON contract, and scaffolded lib files have byte-identical mirrors under internal/scaffold/assets/opencode/lib/ that must be updated together (drift tests enforce parity).
