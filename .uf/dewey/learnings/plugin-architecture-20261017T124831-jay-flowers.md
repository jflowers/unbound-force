---
tag: plugin-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-17T12:48:31Z
identity: plugin-architecture-20261017T124831-jay-flowers
tier: draft
---

Plugin tool factories that validate input via Schema.safeParse(args) plus a hand-rolled issues-to-failure(INVALID_INPUT) envelope replicate that block once per new tool. The unleash-deterministic-tools increment added ten verbatim copies to plugins/uf-workflow/index.ts (uf_delegate_command, uf_unleash_detect_resume, scan_clarifications, resolve_clarification, parse_tasks, mark_task_complete, scan_conflict_markers, format_unleash_exit, format_unleash_demo, write_unleash_summary), violating CS-004's more-than-two-locations extraction rule and doubling every future envelope-policy edit through the byte-identical scaffold mirror. Rule of thumb: when a plugin's third tool factory opens with the same safeParse-to-failure prologue as its siblings, extract a shared parseFailure(result) helper in that same change — the block encodes envelope policy (issue formatting, retryability, error code), which is exactly the kind of knowledge that must not live in N places. Detection heuristic: grep the plugin for `code: "INVALID_INPUT"` and count distinct enclosing execute bodies; each occurrence beyond two is a CS-004 violation that a mirror sync will later double.
