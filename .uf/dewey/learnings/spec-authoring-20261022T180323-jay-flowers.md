---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-22T18:03:23Z
identity: spec-authoring-20261022T180323-jay-flowers
tier: draft
---

When an OpenSpec change modifies a tool's input contract, enumerate the tool's call sites in the actual command templates before writing the delta: grep the templates for the tool name and classify each site by call shape (command-path, prompt-only, and any alternate delegation paths). The delegation-skill-enforcement change (issue #787) missed uf.unleash.md's quick-tier prompt-only implement delegation because its design inventory listed only "per-task implement, code-fix" as the prompt-only shapes; the template actually has three prompt-only call shapes (quick-tier implement at ~line 718, per-task implement at ~line 803, code-fix at ~line 1195) plus a Swarm parallel path that delegates via replicator_forge_spawn_subtask instead of uf_delegate_command. A one-minute grep of the template falsifies the inventory before it hardens into spec requirements.
