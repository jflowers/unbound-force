---
tag: opsxspawn-subtask-classification-params
author: jay-flowers
category: context
created_at: 2026-10-26T02:38:25Z
identity: opsxspawn-subtask-classification-params-20261026T023825-jay-flowers
tier: draft
---

2026-10-26, branch opsx/spawn-subtask-classification-params (re-stored on behalf of Swarm workers whose Dewey instance was down): governance markdown in this repo is hard-wrapped at ~72 columns and uses real em-dashes — verify em-dash bytes (U+2014, e2 80 94) with od -tx1 before exact-match edits, and use rg -Un multiline patterns to grep phrases that wrap across lines. The determinism pack (.opencode/uf/packs/determinism.md) and determinism-first skill (.opencode/skills/determinism-first/SKILL.md) are repo-local files with no scaffold mirror (knownNonEmbeddedFiles), unlike commands and agents which carry byte-identical mirrors under internal/scaffold/assets/.
