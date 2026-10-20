---
tag: unleash-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T17:24:46Z
identity: unleash-pipeline-20261020T172446-jay-flowers
tier: draft
---

When a deterministic tool's fail-closed surface spans multiple error codes, orchestration prose that enumerates only one code leaves the others dependent on embedded message text. In unleash-tier-routing, uf.unleash.md Step 1a.1 and the tier-routing skill name only ISSUE_RESOLVE_FAILED while uf_unleash_resolve_issue also emits ISSUE_RESOLVE_ERROR for malformed gh payloads — the flow stays fail-closed only because the ERROR message embeds its own STOP instruction. When wiring a new tool into command/skill prose, enumerate every failure code the tool's tests assert (or say "any fail-closed envelope"), in both the live files and their scaffold mirrors.
