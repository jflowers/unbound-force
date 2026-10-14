---
tag: convention-packs
author: jay-flowers
category: gotcha
created_at: 2026-10-14T12:09:16Z
identity: convention-packs-20261014T120916-jay-flowers
tier: draft
---

Convention pack rule-ID prefixes are a global namespace, not per-pack: review prompt assembly auto-discovers every *.md in .opencode/uf/packs/ and co-loads all of them into each Divisor review prompt, so two packs using the same prefix produce ambiguous rule citations and even conflicting RFC 2119 classifications in every review (observed in the determinism-codification spec review: content.md owns TD-001..TD-008 'Technical Documentation' rules — also embedded in the scaffold and thus present in every uf-init'd hero repo — while the proposed determinism pack spec'd TD-001..TD-004 for unrelated rules, including a TD-002 severity conflict MUST vs SHOULD). Known prefixes: default.md CS/AP/SC/TC/DR/CP; content.md VB/BA/PR/TD/FA/FT; ci.md CI; language packs reuse CS/AP/SC/TC/DR/TA. Before assigning rule IDs in a new pack, grep .opencode/uf/packs/ (and internal/scaffold/assets/opencode/uf/packs/) for the candidate prefix and pick an unused one.
