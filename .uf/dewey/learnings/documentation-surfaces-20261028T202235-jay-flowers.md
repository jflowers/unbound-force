---
tag: documentation-surfaces
author: jay-flowers
category: pattern
created_at: 2026-10-28T20:22:35Z
identity: documentation-surfaces-20261028T202235-jay-flowers
tier: draft
---

When a UF slash command is added, the complete documentation-surface set is enumerable by grepping a sibling command name (e.g. `uf.address-feedback` or `uf.review-pr`) across all Markdown and filtering to live surfaces. The row-bearing set is exactly three tables — AGENTS.md PR Review Commands, docs/usage.md Quick Reference, docs/architecture.md Review Commands — plus the AGENTS.md Project Structure command-count annotation and the scaffold mirror + expectedAssetPaths registration (byte-identical pair, verifiable via identical git blob hashes in the diff). Non-surfaces that mention sibling commands but must NOT receive the new command: README.md (delegates command reference to docs/usage.md; its multi-model fan-out sentence names only the dispatch commands), docs/heroes.md Divisor capability list (review-posting capability, not a command enumeration — it omits address-feedback and triage-issue too), the review-voice convention packs (govern commands that post review prose), the review-context SKILL command-to-skill table, QUICKSTART.md (no slash-command mentions), and historical openspec/.uf artifacts. Verified on the port-uf-rebase-pr review (2026-10-28): all three tables carried the new row, the "Slash commands (33 files)" annotation matched the actual directory count (33 entries), scaffold commands (12) matched expectedAssetPaths, and the CHANGELOG final line matched the fix-review-dispatch-correlation-release precedent shape "(Spec: …, Fixes: #N, Docs: #N, unbound-force/website#N)".
