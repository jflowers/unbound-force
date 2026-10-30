---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-30T21:22:20Z
identity: uf-workflow-20261030T212220-jay-flowers
tier: draft
---

uf-workflow envelope extensions: when a plugin tool adds a field to its JSON result envelope (e.g., child_session_id on uf_delegate_command's DELEGATE_FAILED/DELEGATE_CANCELLED envelopes), extend the shared ToolFailure type in .opencode/lib/uf-workflow-types.ts — or introduce a tool-narrowed subtype — in the same change. Spreading the field in at the call site (`{ ...envelope, child_session_id }` in plugins/uf-workflow/index.ts) leaves the wire contract undocumented in the type system, forces tests into `(result as { child_session_id?: string })` structural casts, and removes compiler protection: a later rename or removal compiles cleanly and is caught only by specific runtime assertions. Observed on branch quick/sibling-evidence-agent-guidance (2026-10-30).
