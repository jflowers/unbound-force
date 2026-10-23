---
tag: unleash-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-20T19:58:58Z
identity: unleash-pipeline-20261020T195858-jay-flowers
tier: draft
---

When a command delegates a procedure to a skill and declares the skill the single source, the command must not also restate the procedure's tool-call shapes and failure-code enumerations — otherwise the contract lives in four synchronized copies (command, skill, and both scaffold mirrors). Seen in unleash-tier-routing: uf.unleash.md Step 1a.1 declares skill Phase 1 the single source for description-gathering rules while carrying the full uf_unleash_resolve_issue choreography, and Step 1a.4 duplicates skill Phase 4/5's route-decision call shape. Trim the command to a pointer or drop the single-source sentence.
